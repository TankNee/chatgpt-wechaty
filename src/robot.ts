import { PuppetPadlocal } from 'wechaty-puppet-padlocal';
import { Contact, ScanStatus, WechatyBuilder, WechatyOptions } from 'wechaty';
import { PAD_LOCAL_TOKEN, WECHATY_TYPE } from './configs';
import { ContactSelfInterface, MessageInterface, WechatyInterface } from 'wechaty/impls';
import log4js from './logger';
import { isNullOrEmpty } from './utils';
import qrcodeTerminal from 'qrcode-terminal';
import { MessageType, MessageTypeName } from './interfaces';
import ChatGPT from './chatgpt';

class ChatRobot {
  private bot: WechatyInterface;
  private logger: log4js.Logger;
  private chatgpt: ChatGPT;

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
      default:
        throw new Error(`WeChaty: Init: Unknown WechatPuppetType: ${WECHATY_TYPE}`);
    }

    return WechatyBuilder.build(options);
  }

  constructor() {
    this.bot = this.init();
    this.logger = log4js.getLogger('ChatRobot');
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
    if (message.self()) return;
    this.logger.debug(`Message from ${message.talker().name()}`);

    try {
      switch (message.type()) {
        case MessageType.Text:
          const room = message.room();
          const isMentionSelf = await message.mentionSelf();
          if (room && !isMentionSelf) break;

          const text = message.text().replace(/@.*\s/, '');
          const response = await this.chatgpt.sendMessage(text, message.talker());

          if (room) {
            await room.say(response, message.talker());
            break;
          }
          await message.say(response);
          break;
        default:
          this.logger.debug(`Message Type: ${MessageTypeName[message.type()]}`);
          break;
      }
    } catch (error) {
      this.logger.error(error);
      if (error.message.includes('ChatGPT')) {
        await message.say(error.message);
      }
      this.logger.error(`Message: ${message.talker().name()} - ${MessageTypeName[message.type()]} - ${message.text()}`);
    }
  }
}

export default ChatRobot;
