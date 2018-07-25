const auth = require('../auth.json');
const botTypes = require('./botTypes.json');
const Bot = require('./Bot.js');
const Discord = require('discord.io');
const _ = require('lodash');
const settings = require('../settings.json');

module.exports = class DiscordBot extends Bot {
  constructor(logger, repo) {
    let bot = new Discord.Client({
      token: auth.discord.token,
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
          super.receivedMessage(userID, channelID, message);
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

  getChannels() {
    return _.map(this.bot.channels, (c) => { return { id: c.id, name: c.name }; });
  }

  getUsernameById(userID) {
    return _.find(this.bot.users, (u) => { return u.id === userID; }).username;
  }

  getUsers() {
    return _.map(this.bot.users, (u) => { return u.username; });
  }

  getGeneralChannelId() {
    let channel = _.first(_.filter(this.bot.channels, (c) => { return c.name === settings.channels.general; }));
    return channel ? channel.id : null;
  }

  sendMessage(channelID, message) {
    this.bot.sendMessage({
      to: channelID,
      message: message
    }, (error, response) => {
      if(error) {
        this.logger.error(error);
      }
    });
  }

  sendMessageToUser(userId, message) {
    this.bot.sendMessage({
      to: userId,
      message: message
    }, (error, response) => {
      if(error) {
        this.logger.error(error);
      }
    });
  }
};