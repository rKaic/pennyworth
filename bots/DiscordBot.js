const botTypes = require('./botTypes.json');
const Bot = require('./Bot.js');
const Discord = require('discord.io');
const _ = require('lodash');
const settings = require('../settings.json');

module.exports = class DiscordBot extends Bot {
  constructor(logger, repo, token) {
    let bot = new Discord.Client({
      token: token,
      autorun: true
    });
    super(bot, botTypes.discord, logger, repo);
  }

  initialize() {
    super.initialize();

    this.bot.on('ready', (evt) => {
      this.logger.info('Connected to Discord');
      this.logger.info('Logged in as: ');
      this.logger.info(this.bot.username + ' - (' + this.bot.id + ')');
      super.initialized();
    });

    this.bot.on('message', (user, userID, channelID, message, evt) => {
        // Our bot needs to know if it will execute a command
        // It will listen for messages that will start with `!`
        if (this.isCommand(message)) {
          this.logger.info(`From Discord: ${message}`);
          super.receivedMessage(userID, channelID, evt.d.guild_id, message);
         }
    });

    this.bot.on('disconnect', (errMsg, code) => { 
      this.logger.error(`Error connecting to Discord: ${errMsg}`);
    });
  }

  getName() {
    return this.bot.username;
  }

  getId() {
    return this.bot.id;
  }

  getChannels(serverID) {
    let serverChannels = _.filter(this.bot.channels, (c) => { return c.guild_id === serverID && c.type === 0; });
    return _.map(serverChannels, (c) => { return { id: c.id, name: c.name }; });
  }

  getUsernameById(userID) {
    return _.find(this.bot.users, (u) => { return u.id === userID; }).username;
  }

  getUserIds(serverID) {
    let currentServer = this.bot.servers[serverID];
    let serverMemberIds = _.filter(Object.keys(currentServer.members), (id) => { return id !== settings.botId; });
    return serverMemberIds;
  }

  async sendMessage(channelID, message) {
    await this.bot.sendMessage({
      to: channelID,
      message: message
    }, (error, response) => {
      if(error) {
        this.logger.error(error);
      }
    });
  }

  async sendMessageToUser(userId, message) {
    await this.bot.sendMessage({
      to: userId,
      message: message
    }, (error, response) => {
      if(error) {
        this.logger.error(error);
      }
    });
  }
};