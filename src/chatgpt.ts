import fs from 'fs';
import 'isomorphic-unfetch';
import OpenAI from 'openai';
import { Contact } from 'wechaty';
import { MAX_TOKENS, OPENAI_API_KEY, OPENAI_BASE_URL, SYSTEM_PROMPT, TEMPERATURE, TOP_P } from './configs';
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
    message: string,
    history: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
  ): Promise<[string, OpenAI.Chat.Completions.ChatCompletionMessageParam[]]> {
    this.logger.info(`Sending message to ChatGPT: ${message}`);

    history.push({ role: 'user', content: message });
    const response = await this.api.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: history,
      max_tokens: MAX_TOKENS,
      temperature: TEMPERATURE,
      top_p: TOP_P,
    });
    let responseText = response.choices[0].message.content;
    return [responseText, history];
  }

  async sendMessage(message: string, talker: Contact): Promise<string> {
    if (!this.conversations.has(talker.id)) {
      const initial_history: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [{ role: 'system', content: SYSTEM_PROMPT }];
      this.conversations.set(talker.id, initial_history);
    }
    const oldHistory = this.conversations.get(talker.id);

    this.logger.info(`Sending message to ChatGPT: ${message}`);
    const [responseText, history] = await this.getAIResponse(message, oldHistory);
    this.logger.info(`Received response from ChatGPT: ${responseText}`);

    this.conversations.set(talker.id, history);
    // save data
    this.saveMessageHistory(talker, message, 'user', null);
    this.saveMessageHistory(talker, responseText, 'bot', history);

    return responseText;
  }

  async removeConversation(talker: Contact): Promise<void> {
    if (!this.conversations.has(talker.id)) return;
    this.conversations.delete(talker.id);

    this.logger.info(`Removed conversation with ${talker.name()}`);
    // 打印全部会话
    this.logger.info(this.conversations);
  }

  async saveMessageHistory(talker: Contact, text: string, role: string, detail: any): Promise<void> {
    // save to local file
    // const path = `./history/${talker.id}.txt`;
    const path = `./history/wechat_${talker.name()}.json`;

    // 存储为json格式
    let data = [];
    if (fs.existsSync(path)) {
      const rawData = fs.readFileSync(path, 'utf-8');
      data = JSON.parse(rawData);
    }
    data.push({ text, time: new Date().toLocaleString(), role, detail });
    fs.writeFileSync(path, JSON.stringify(data, null, 2));
  }
}

export default ChatGPT;
