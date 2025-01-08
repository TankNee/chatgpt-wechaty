import 'isomorphic-unfetch';
import OpenAI from 'openai';
import { Contact } from 'wechaty';
import { MessageInterface } from 'wechaty/impls';
import { MAX_TOKENS, OPENAI_API_KEY, OPENAI_BASE_URL, OPENAI_MODEL_NAME, SYSTEM_PROMPT, TEMPERATURE, TOP_P } from './configs';
import log4js from './logger';
import { saveMessageHistory } from './utils';

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
    message: string,
    history: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
  ): Promise<[string, OpenAI.Chat.Completions.ChatCompletionMessageParam[]]> {
    history.push({ role: 'user', content: [{ type: 'text', text: message }] });
    const response = await this.api.chat.completions.create({
      model: OPENAI_MODEL_NAME,
      messages: history,
      max_tokens: MAX_TOKENS,
      temperature: TEMPERATURE,
      top_p: TOP_P,
    });
    let responseText = response.choices[0].message.content;
    return [responseText, history];
  }

  buildConversationId(message: MessageInterface): string {
    let convsationId = `${message.talker().id}`;
    if (message.room()) {
      convsationId = `${message.room().id}-${message.talker().id}`;
    }
    return convsationId;
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
    const [responseText, history] = await this.getAIResponse(text, oldHistory);
    this.logger.info(`Received response from ChatGPT: ${responseText}`);

    this.conversations.set(convsationId, history);
    // save data
    saveMessageHistory(talker, message, text, 'user', { type: 'text' });
    saveMessageHistory(talker, message, responseText, 'bot', { type: 'text' });

    return responseText;
  }

  async addImageMessage(talker: Contact, message: MessageInterface) {
    this.initHistory(message);
    const convsationId = this.buildConversationId(message);
    const image = await message.toFileBox();
    const imageBase64 = await image.toBase64();

    saveMessageHistory(message.talker(), message, '', 'user', { type: 'image', data: imageBase64 });
    const oldHistory = this.conversations.get(convsationId);
    // remove previous images
    const newHistory = [];
    for (const item of oldHistory) {
      // @ts-ignore
      if (item.content[0].type !== 'image_url') {
        newHistory.push(item);
      }
    }
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
      ],
    });
    this.conversations.set(convsationId, newHistory);
    this.logger.info(`Added image message to conversation with ${talker.name()} and remove previous images`);
  }
}

export default ChatGPT;
