import qrcodeTerminal from 'qrcode-terminal';
import { Contact, ScanStatus, WechatyBuilder, WechatyOptions } from 'wechaty';
import { PuppetMock } from 'wechaty-puppet-mock';
import { PuppetPadlocal } from 'wechaty-puppet-padlocal';
import { PuppetWechat4u } from 'wechaty-puppet-wechat4u';
import { PuppetWeChat } from 'wechaty-puppet-wechat'
import { ContactSelfInterface, MessageInterface, WechatyInterface } from 'wechaty/impls';
import ChatGPT from './chatgpt';
import { CommandManager } from './command';
import { CHROME_BIN, PAD_LOCAL_TOKEN, WECHATY_TYPE } from './configs';
import { MessageType, MessageTypeName } from './interfaces';
import log4js from './logger';
import { notInRoomWhiteList, RuleManager } from './rule';
import { isNullOrEmpty, saveMessageHistory } from './utils';

class ChatRobot {
  private bot: WechatyInterface;
  private logger: log4js.Logger;
  private ruleManager: RuleManager;
  private chatgpt: ChatGPT;
  private commandManager: CommandManager;

  private init() {
    let options: WechatyOptions;
    switch (WECHATY_TYPE) {
      case 'padlocal':
        options = {
          puppet: new PuppetPadlocal({
            token: PAD_LOCAL_TOKEN,
          }),
        };
        break;
      case 'mock':
        options = {
          puppet: new PuppetMock(),
        };
        break;
        case 'wechat4u':
          options = {
            puppet: new PuppetWechat4u({
              uos: true,
              ...CHROME_BIN,
            }),
          };
          break;
      case 'wechat':
        options = {
          puppet: new PuppetWeChat({
            uos: true,
            ...CHROME_BIN,
          }),
        };
        break;
      default:
        throw new Error(`WeChaty: Init: Unknown WechatPuppetType: ${WECHATY_TYPE}`);
    }

    return WechatyBuilder.build(options);
  }

  constructor() {
    this.bot = this.init();
    this.logger = log4js.getLogger('ChatRobot');
    this.ruleManager = new RuleManager();
    this.commandManager = new CommandManager();
    this.chatgpt = new ChatGPT();
    this.attachHandlers();
  }

  public async start(): Promise<ChatRobot> {
    await this.bot.start();
    this.logger.info('Bot started');
    return this;
  }

  private attachHandlers(): void {
    this.bot.on('scan', this.scanHandler.bind(this));
    this.bot.on('error', this.errorHandler.bind(this));
    this.bot.on('login', this.loginHandler.bind(this));
    this.bot.on('logout', this.logoutHandler.bind(this));
    this.bot.on('message', this.messageHandler.bind(this));
  }

  private scanHandler(qrcode: string, status: ScanStatus): void {
    this.logger.info(`Scan QR Code to login: ${status}`);

    switch (status) {
      case ScanStatus.Waiting:
      case ScanStatus.Timeout:
        if (isNullOrEmpty(qrcode)) break;

        qrcodeTerminal.generate(qrcode, { small: true }); // show qrcode on console

        const qrcodeImageUrl = ['https://wechaty.js.org/qrcode/', encodeURIComponent(qrcode)].join('');

        this.logger.info('StarterBot', ScanStatus[status], status, qrcodeImageUrl);

        break;
      case ScanStatus.Scanned:
        this.logger.info('Scan Status: Scanned');
        break;
      case ScanStatus.Confirmed:
        this.logger.info('Scan Status: Confirmed');
        break;
      default:
        this.logger.info('Scan Status: Unknown');
        break;
    }
  }

  private async errorHandler(error: Error): Promise<void> {
    this.logger.error(error);
  }

  private async loginHandler(user: ContactSelfInterface): Promise<void> {
    this.logger.info(`User ${user.name()} logged in`);
  }

  private async logoutHandler(user: ContactSelfInterface | Contact): Promise<void> {
    this.logger.info(`User ${user.name()} logged out`);
  }

  private async messageHandler(message: MessageInterface): Promise<void> {
    if (!message.self()) {
      this.logger.debug(`Message from ${message.talker().name()}`);
    }
    if (await notInRoomWhiteList.check(message)) {
      return;
    }

    try {
      switch (message.type()) {
        case MessageType.Text:
          const room = message.room();
          const text = message
            .text()
            .replace(/@[^\s]*\s/, '')
            .replace(/^提问/, '');
          if (text === 'chatgpt rule') {
            await message.say(this.ruleManager.showRules());
            break;
          } else if (text === 'clear') {
            this.chatgpt.clearHistory(message);
            this.logger.info('Clearing history...');
          }
          
          this.chatgpt.addTextMessage(message);
          if (!(await this.ruleManager.valid(message))) break;
          // 如果执行了命令，就不再执行下面的逻辑
          if (await this.commandManager.handle(message)) break;
          let response = await this.chatgpt.sendMessage(text, message, message.talker());

          if (room) {
            await room.say(response, message.talker());
            break;
          } else if (message.self()) {
            await message.listener().say(response);
            break;
          }
          await message.say(response);
          break;
        case MessageType.Image:
          this.logger.debug(`Message Type: ${MessageTypeName[message.type()]} from ${message.talker().name()}`);
          await this.chatgpt.addImageMessage(message);
          break;
        case MessageType.Unknown:
          break;
        default:
          this.logger.debug(`Message Type: ${MessageTypeName[message.type()]} from ${message.talker().name()}`);
          break;
      }
    } catch (error) {
      this.logger.error(error);
      this.logger.error(`Message: ${message.talker().name()} - ${MessageTypeName[message.type()]} - ${message.text()}`);
    }
  }
}

export default ChatRobot;
