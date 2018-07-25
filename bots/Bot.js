const botTypes = require('./botTypes.json');
const events = require('events');

class Bot {
  constructor(bot, botType, logger, repo) {
    this.bot = bot;
    this.botType = botType;
    this.logger = logger;
    this.commandParam = '!';
    events.EventEmitter.call(this);
  }

  initialize() {
  }

  initialized() {
    this.emit("initialized");
  }

  isCommand(message) {
    return message.startsWith(this.commandParam);
  }

  getBotType() {
    return this.botType;
  }

  getName() {
    return null;
  }

  getId() {
    return null;
  }

  getChannels(serverID) {
    return [];
  }

  getUsernameById(userID) {
    return null;
  }

  getUserIds(serverID) {
    return [];
  }

  sendMessage(channelId, message) {
    logger.info(JSON.stringify({channelId, message}));
  }

  sendMessageToUser(userId, message) {
    logger.info(JSON.stringify({userId, message}));
  }

  receivedMessage(userID, channelID, serverID, message) {
    let args = message.replace(this.commandParam, "").split(' ');
    let command = args[0];
    let params = args.slice(1);
    this.emit('message', userID, channelID, serverID, command, params, this);
  }
};

Bot.prototype.__proto__ = events.EventEmitter.prototype;

module.exports = Bot;