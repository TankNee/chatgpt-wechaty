import { MessageInterface } from 'wechaty/impls';
import { ROOM_WHITE_LIST } from './configs';
import log4js from './logger';
import { saveRoomMessage } from './utils';
export interface Rule {
  description: string;
  check: (message: MessageInterface) => Promise<boolean>;
}

// 不在群聊白名单
export const notInRoomWhiteList: Rule = {
  description: '不在群聊白名单',
  check: async (message: MessageInterface) => {
    const room = message.room();
    if (!room) {
      return false;
    } else {
      const isWhiteList = ROOM_WHITE_LIST.includes(room.id);
      const isWhiteNameList = ROOM_WHITE_LIST.includes(await room.topic());
      if (isWhiteList || isWhiteNameList) saveRoomMessage(message);

      return !isWhiteList && !isWhiteNameList;
    }
  },
};

export class RuleManager {
  private refuseRules: Rule[] = [];
  private acceptRules: Rule[] = [];

  private logger = log4js.getLogger('RuleManager');

  constructor() {
    this.initRules();
  }

  public initRules() {
    const mentionAll: Rule = {
      description: '发送@全体成员',
      check: async (message: MessageInterface) => {
        const isMentionAll = (await message.mentionSelf()) && message.text().includes('@所有人');
        return isMentionAll;
      },
    };

    const pubAnnouncement: Rule = {
      description: '发送群公告',
      check: async (message: MessageInterface) => {
        const isAnnouncement = message.text().startsWith('群公告');
        return isAnnouncement;
      },
    };

    // 接受类规则
    const isRoomAndMentionSelf: Rule = {
      description: '群聊且@自己',
      check: async (message: MessageInterface) => {
        const room = !!message.room();
        const isMentionSelf = await message.mentionSelf();
        return room && isMentionSelf;
      },
    };

    // 群聊且是自己发言且开头带有提问
    const isRoomAndSelfAndStartWithQuestion: Rule = {
      description: '群聊且不是机器人发言且开头带有"提问"',
      check: async (message: MessageInterface) => {
        const room = !!message.room();
        const isStartWithQuestion = message.text().startsWith('提问');
        return room && !message.self() && isStartWithQuestion;
      },
    };

    const isPrivateAndStartWithQuestion: Rule = {
      description: '私聊且以"提问"开头',
      check: async (message: MessageInterface) => {
        const room = !!message.room();
        const isStartWithQuestion = message.text().startsWith('提问');
        return !room && isStartWithQuestion;
      },
    };

    this.refuseRules = [mentionAll, pubAnnouncement];
    this.acceptRules = [isRoomAndMentionSelf, isRoomAndSelfAndStartWithQuestion, isPrivateAndStartWithQuestion];

    this.logger.info('RuleManager initialized');
  }

  public async valid(message: MessageInterface): Promise<boolean> {
    for (const rule of this.refuseRules) {
      if (await rule.check(message)) {
        this.logger.debug(`Refuse message: ${rule.description}`);
        return false;
      }
    }

    for (const rule of this.acceptRules) {
      if (await rule.check(message)) {
        this.logger.debug(`Accept question: ${rule.description}`);
        return true;
      }
    }
    this.logger.debug('Refuse message: No rule matched');
    return false;
  }

  public showRules(): string {
    // for refuse rules
    let ruleDescription = '在下面这些情况中，ChatGPT不会回答你的问题\n';
    for (const rr of this.refuseRules) {
      ruleDescription += `${this.refuseRules.findIndex(r => r === rr)}：${rr.description}\n`;
    }
    ruleDescription += '你需要依照下面这些提问方法来对ChatGPT进行提问\n';
    for (const ar of this.acceptRules) {
      ruleDescription += `${this.acceptRules.findIndex(r => r === ar)}：${ar.description}\n`;
    }
    ruleDescription += '注意，开头的"提问"不会被纳入提问内容';

    return ruleDescription;
  }
}
