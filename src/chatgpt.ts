import 'isomorphic-unfetch';
import { ChatGPTAPI } from 'chatgpt';
import { Contact } from 'wechaty';
import { OPENAI_API_KEY, OPENAI_BASE_URL } from './configs';
import log4js from './logger';
import fs from 'fs';
class ChatGPT {
  private api: ChatGPTAPI;
  private logger: log4js.Logger;
  // talker id and last message id, refer https://github.com/transitive-bullshit/chatgpt-api#readme
  private conversations: Map<string, string>;

  constructor() {
    this.api = new ChatGPTAPI({
      apiKey: OPENAI_API_KEY as string,
      apiBaseUrl: OPENAI_BASE_URL as string,
    });
    this.logger = log4js.getLogger('ChatGPT');
    this.conversations = new Map();
  }

  async sendMessage(message: string, talker: Contact): Promise<string> {
    if (!this.conversations.has(talker.id)) {
      this.conversations.set(talker.id, null);
    }
    const lastMessageId = this.conversations.get(talker.id);

    this.logger.info(`Sending message to ChatGPT: ${message}`);
    const response = await this.api.sendMessage(message, { timeoutMs: 2 * 60 * 1000, parentMessageId: lastMessageId });
    let responseText = response.text;
    this.logger.info(`Received response from ChatGPT: ${responseText}`);

    this.conversations.set(talker.id, response.id);
    // save data
    this.saveMessageHistory(talker, message, 'user', null);
    this.saveMessageHistory(talker, responseText, 'bot', response.detail);

    responseText = responseText.replace(/^提问/, '');

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
