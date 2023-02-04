import { BotType, ChannelType, FormattedMessage, MessageConfirmation } from '../Types';
import Bot from './Bot';
import Discord from 'discord.io';
import _ from 'lodash';

class DiscordBot extends Bot {
  constructor(logger, repo, token) {
    let bot = new Discord.Client({
      token: token,
      autorun: true
    });
    super(bot, BotType.Discord, logger, repo);
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
          super.receivedMessage({userID, channelID, serverID: evt.d.guild_id, message});
         }
    });

    this.bot.on('disconnect', (errMsg, code) => { 
      this.logger.error(`Error connecting to Discord: ${errMsg}`);
    });
  }

  getName() {
    return this.bot.username;
  }

  getFullName() {
    return `${this.bot.username} (${BotType[this.getBotType()]})`;
  }

  getId() {
    return this.bot.id;
  }

  getChannels(serverID: string) {
    let serverChannels = _.filter(this.bot.channels, (c) => { return c.guild_id === serverID && c.type === 0; });
    return _.map(serverChannels, (c) => { return { id: c.id, name: c.name }; });
  }

  getUsernameById(userID: string) {
    return _.find(this.bot.users, (u) => { return u.id === userID; }).username;
  }

  getUserIds(serverID: string) {
    let currentServer = this.bot.servers[serverID];
    return Object.keys(currentServer.members);
  }

  async sendMessage(channelID: string, message: string | FormattedMessage[], threadID?: string): Promise<MessageConfirmation> {
    return await this.bot.sendMessage({
      to: channelID,
      message: message
    }, (error, response) => {
      if(error) {
        this.logger.error(error);
      }
    });
  }

  async sendMessageToUser(userID: string, message: string | FormattedMessage[], threadID?: string): Promise<MessageConfirmation> {
    return await this.bot.sendMessage({
      to: userID,
      message: message
    }, (error, response) => {
      if(error) {
        this.logger.error(error);
      }
    });
  }

  async sendMessageToChannelType(message: string | FormattedMessage[], channelType: ChannelType, threadID?: string): Promise<MessageConfirmation> {
    this.logger.warning(`${BotType[this.botType]} bots are not yet capable of sendMessageToChannelType`);
    return {
      success: false,
      botType: this.botType,
      userID: '',
      channelID: '',
      threadID: ''
    };
  }

  async updateMessage(channelID: string, message: string | FormattedMessage[], messageID: string): Promise<MessageConfirmation> {
    this.logger.warning(`${BotType[this.botType]} bots are not yet capable of updateMessage`);
    return {
      success: false,
      botType: this.botType,
      userID: '',
      channelID,
      threadID: messageID
    };
  }
};

export default DiscordBot;