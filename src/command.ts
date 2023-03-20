import { MessageInterface } from 'wechaty/impls';
import ChatGPT from './chatgpt';
import log4js from './logger';
import { getRoomMessage } from './utils';

export interface Command {
  name: string;
  description: string;
  // 检查命令有效性，先验证名字，再检查有效性
  check(message: MessageInterface): boolean;
  // 执行命令
  do(message: MessageInterface): Promise<void>;
}

export class CommandManager {
  commands: Map<string, Command>;
  logger: log4js.Logger;
  chatgpt: ChatGPT;
  constructor() {
    this.commands = new Map();
    this.logger = log4js.getLogger('CommandManager');
    this.chatgpt = new ChatGPT();

    this.init();
  }

  public init(): void {
    this.commands.clear();

    const summaryRoomMessage: Command = {
      name: 'summary',
      description: '汇总群消息，默认汇总本群的最近50条消息',
      check: (message: MessageInterface): boolean => {
        const text = message.text().replace(/@[^\s]*\s/, '').replace(/^提问/, '');
        if (!text) {
          return false;
        }
        const args = text.split(' ');
        if (args.length > 2) {
          return false;
        }
        if (args.length === 2) {
          const num = parseInt(args[1]);
          if (isNaN(num)) {
            return false;
          }
        }
        return true;
      },
      do: async (message: MessageInterface): Promise<void> => {
        const room = message.room();
        const topic = await room.topic();
        const args = message.text().replace(/@[^\s]*\s/, '').replace(/^提问/, '').split(' ');
        const num = args.length === 2 ? parseInt(args[1]) : 50;
        const messages = getRoomMessage(room.id, num);
        const summary = messages.map(m => `[${m.time.toLocaleString()}]${m.talker}: ${m.text}`).join('\n');
        const prompt = `以下是${topic}的最近${num}条消息，你要做的是用中文总结全部内容，统计分析发言者的发言内容和发言数量，不能出现特殊格式，用纯文本的形式输出，不可以纯粹复述聊天内容。\n\n${summary}`
        const summaryResult = await this.chatgpt.sendMessage(prompt, message.talker());
        await room.say(summaryResult, message.talker());
      },
    };

    this.register(summaryRoomMessage);
  }

  public register(command: Command): void {
    if (this.commands.has(command.name)) {
      this.logger.warn(`Command ${command.name} already exists`);
      return;
    }
    this.commands.set(command.name, command);
  }

  public async handle(message: MessageInterface): Promise<boolean> {
    const text = message.text().replace(/@[^\s]*\s/, '').replace(/^提问/, '');
    if (!text) {
      return false;
    }
    const args = text.split(' ');
    this.logger.debug(`Command: ${args}`);
    const command = this.commands.get(args[0]);
    if (!command) {
      return false;
    }
    if (!command.check(message)) {
      return false;
    }
    await command.do(message);
    return true;
  }
}
