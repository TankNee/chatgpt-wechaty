import log4js from 'log4js';

log4js.configure({
  appenders: {
    console: { type: 'console' },
    file: { type: 'file', filename: 'logs/robot.log' },
  },
  categories: {
    default: { appenders: ['console'], level: 'debug' },
    file: { appenders: ['file'], level: 'debug' },
  },
});

export default log4js;
