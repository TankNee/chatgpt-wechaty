import ChatRobot from './robot';
import log4js from './logger';

const robot = new ChatRobot();
const logger = log4js.getLogger('Main');

robot.start().catch(error => {
  logger.error(error);
});
