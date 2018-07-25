const auth = require('../auth.json');
const botTypes = require('./botTypes.json');
const Bot = require('./Bot.js');
const Slack = require('slackbots');
const _ = require('lodash');
const settings = require('../settings.json');

const iconUrl = "https://i.imgur.com/xsnGmvC.jpg";
const username = "Pennyworth";

module.exports = class SlackBot extends Bot {
  constructor(logger, repo) {
    let bot = new Slack({
      token: auth.slack.token,
      name: username
    });
    super(bot, botTypes.slack, logger, repo);
  }

  initialize() {
    super.initialize();

    this.bot.on("start", () => {
      this.logger.info('Connected to Slack');
      this.logger.info('Logged in as: ');
      this.logger.info(`${this.bot.self.name} - (${this.bot.self.id})`);
      super.initialized();
    });
    
    this.bot.on("message", (message) => {
      if(message.type === "message" && message.text && this.isCommand(message.text)) {
        this.logger.info(`From Slack: ${message.text}`);
        super.receivedMessage(message.user, message.channel, message.team, message.text);
      }
    });

    this.bot.on("error", () => {
      this.logger.error("Error connecting to Slack!");
    });
  }

  getName() {
    return this.bot.self.name;
  }

  getId() {
    return this.bot.self.id;
  }

  getChannels(serverID) {
    return _.map(this.bot.channels, (c) => { return { id: c.id, name: c.name }; });
  }

  getUsernameById(userID) {
    return _.find(this.bot.users, (u) => { return u.id === userID; }).real_name;
  }

  getUserIds(serverID) {
    return _.map(this.bot.users, (u) => { return u.id; });
  }

  sendMessage(channelID, message) {
    this.bot.postMessage(channelID, message, { as_user: false, username: username, icon_url: iconUrl });
  }

  sendMessageToUser(userId, message) {
    this.bot.postMessage(userId, message, { as_user: false, username: username, icon_url: iconUrl });
  }
};