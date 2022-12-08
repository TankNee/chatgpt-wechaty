import { ChatGPTAPI, ChatGPTConversation } from 'chatgpt';
import { Contact } from 'wechaty';
import { SESSION_TOKEN } from './configs';
import log4js from './logger';

class ChatGPT {
  private api: ChatGPTAPI;
  private logger: log4js.Logger;
  private conversations: Map<string, ChatGPTConversation>;

  constructor() {
    this.api = new ChatGPTAPI({
      sessionToken: SESSION_TOKEN as string,
    });
    this.logger = log4js.getLogger('ChatGPT');
    this.conversations = new Map();
  }

  async sendMessage(message: string, talker: Contact): Promise<string> {
    if (!this.conversations.has(talker.id)) {
      const conversation = this.api.getConversation();
      this.conversations.set(talker.id, conversation);
    }
    const conversation = this.conversations.get(talker.id);
    await conversation.api.ensureAuth();

    this.logger.info(`Sending message to ChatGPT: ${message}`);
    const response = await conversation.sendMessage(message, { timeoutMs: 60000 });
    this.logger.info(`Received response from ChatGPT: ${response}`);
    return response;
  }
}

export default ChatGPT;
