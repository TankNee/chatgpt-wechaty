import 'isomorphic-unfetch';
import OpenAI from 'openai';
import { Contact } from 'wechaty';
import { MessageInterface } from 'wechaty/impls';
import { HISTORY_LIMIT, MAX_TOKENS, OPENAI_API_KEY, OPENAI_BASE_URL, OPENAI_MODEL_NAME, SYSTEM_PROMPT, TEMPERATURE, TOP_P } from './configs';
import log4js from './logger';

class ChatGPT {
  private api: OpenAI;
  private logger: log4js.Logger;
  // talker id and last message id, refer https://github.com/transitive-bullshit/chatgpt-api#readme
  private conversations: Map<string, OpenAI.Chat.Completions.ChatCompletionMessageParam[]>;

  constructor() {
    this.api = new OpenAI({
      apiKey: OPENAI_API_KEY as string,
      baseURL: OPENAI_BASE_URL,
    });
    this.logger = log4js.getLogger('ChatGPT');
    this.conversations = new Map();
  }

  async getAIResponse(
    messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
  ): Promise<[string, OpenAI.Chat.Completions.ChatCompletionMessageParam[]]> {
    // slice HISTORY_LIMIT messages
    const response = await this.api.chat.completions.create({
      model: OPENAI_MODEL_NAME,
      messages,
      max_tokens: MAX_TOKENS,
      temperature: TEMPERATURE,
      top_p: TOP_P,
    });
    let responseText = response.choices[0].message.content;
    messages.push({ role: 'assistant', content: [{ type: 'text', text: responseText }] });
    return [responseText, messages];
  }

  buildConversationId(message: MessageInterface): string {
    let convsationId = `${message.talker().id}`;
    if (message.room()) {
      // convsationId = `${message.room().id}-${message.talker().id}`;
      convsationId = `${message.room().id}`;
    }
    return convsationId;
  }

  buildUserText(message: MessageInterface, text: string = ''): string {
    let messageText = text;
    // if (message.room()) {
    //   messageText = `群友【${message.talker().name()}】：${text}`;
    // }
    return messageText;
  }

  initHistory(message: MessageInterface): void {
    let convsationId = this.buildConversationId(message);
    if (!this.conversations.has(convsationId)) {
      const initial_history: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        { role: 'system', content: [{ type: 'text', text: SYSTEM_PROMPT }] },
      ];
      this.conversations.set(convsationId, initial_history);
    }
  }

  async sendMessage(text: string, message: MessageInterface, talker: Contact): Promise<string> {
    this.initHistory(message);
    const convsationId = this.buildConversationId(message);
    const oldHistory = this.conversations.get(convsationId);

    this.logger.info(`Sending message to ChatGPT: ${text}`);
    const messages = oldHistory.slice(-HISTORY_LIMIT);
    messages.push({ role: 'user', content: [{ type: 'text', text: this.buildUserText(message, text) }] });
    const [responseText, history] = await this.getAIResponse(messages);
    this.logger.info(`Received response from ChatGPT: ${responseText}`);

    this.conversations.set(convsationId, history);
    // save data
    // saveMessageHistory(talker, message, text, 'user', { type: 'text' });
    // saveMessageHistory(talker, message, responseText, 'bot', { type: 'text' });

    return responseText;
  }

  async addTextMessage(message: MessageInterface) {
    this.initHistory(message);
    const convsationId = this.buildConversationId(message);
    const text = message.text();
    // saveMessageHistory(message.talker(), message, text, 'user', { type: 'text' });
    const oldHistory = this.conversations.get(convsationId);
    oldHistory.push({ role: 'user', content: [{ type: 'text', text: this.buildUserText(message, text) }] });
    this.conversations.set(convsationId, oldHistory);
  }

  async addImageMessage(message: MessageInterface) {
    this.initHistory(message);
    const convsationId = this.buildConversationId(message);
    const image = await message.toFileBox();
    const imageBase64 = await image.toBase64();

    // saveMessageHistory(message.talker(), message, '', 'user', { type: 'image', data: imageBase64 });
    const oldHistory = this.conversations.get(convsationId);
    // @ts-ignore
    const newHistory = oldHistory.filter(msg => msg.content[0].type !== 'image_url');
    newHistory.push({
      role: 'user',
      content: [
        {
          type: 'image_url',
          image_url: {
            url: `data:image/jpeg;base64,${imageBase64}`,
            detail: 'high',
          },
        },
        {
          type: 'text',
          text: `【${message.talker().name()}】发送了一张图片。`,
        },
      ],
    });
    this.conversations.set(convsationId, newHistory);
    this.logger.info(`Added image message to conversation with ${message.talker().name()} and remove previous image messages.`);
  }

  clearHistory(message: MessageInterface) {
    const convsationId = this.buildConversationId(message);
    this.conversations.set(convsationId, []);
  }
}

export default ChatGPT;
