import log4js from 'log4js';

log4js.configure({
  appenders: {
    console: { type: 'console' },
    file: { type: 'file', filename: 'logs/robot.log' },
    // file name with timestamp
    production: {
      type: 'dateFile',
      filename: 'logs/robot-pro-',
      pattern: 'yyyy-MM-dd.log',
      alwaysIncludePattern: true,
    },
  },
  categories: {
    default: { appenders: ['console'], level: 'debug' },
    file: { appenders: ['file'], level: 'debug' },
    ChatGPT: { appenders: ['console', 'production'], level: 'debug' },
    ChatRobot: { appenders: ['console', 'production'], level: 'debug' },
    Main: { appenders: ['console', 'production'], level: 'debug' },
    RuleManager: { appenders: ['console', 'production'], level: 'debug' },
  },
});

export default log4js;
