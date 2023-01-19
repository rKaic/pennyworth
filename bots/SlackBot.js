const botTypes = require('./botTypes.json');
const Bot = require('./Bot.js');
const { App } = require('@slack/bolt');
const _ = require('lodash');

const iconUrl = "https://i.imgur.com/xsnGmvC.jpg";
const username = "Pennyworth";

module.exports = class SlackBot extends Bot {
  constructor(logger, repo, botToken, appToken, signingSecret) {
    let bot = new App({
      appToken: appToken,
      token: botToken,
      signingSecret: signingSecret,
      name: username,
      socketMode: true
    });
    super(bot, botTypes.slack, logger, repo);
  }

  initialize() {
    super.initialize();

    (async () => {
      const port = 3000
      // Start your app
      await this.bot.start(process.env.PORT || port);
      console.log(`⚡️ Slack Bolt app is running on port ${port}!`);
    })();

    this.bot.message(/!.*/, async ({message, say}) => {
      if(message.type === "message" && message.text && this.isCommand(message.text)) {
        this.logger.info(`Message from Slack: ${message.text}`);
        super.receivedMessage(message.user, message.channel, message.team, message.text);
      }
    });

    this.bot.command(/\/.*/, async ({ command, ack, say }) => {
      await ack();
      const rawCommand = command.command.replace('/', '');
      if(rawCommand) {
        this.logger.info(`Command from Slack: ${command.command}`);
        super.receivedMessage(command.user_id, command.channel_id, command.team_id, `${rawCommand} ${command.text}`);
      }
    });

    this.bot.action(/.*/, async ({ action, body, ack, say }) => {
      await ack();

      // TODO - This is fragile
      const checkedValues = Object.values(body.state.values).flatMap(val => val.check.selected_options.map(opt => opt.value));
      if(action.action_id) {
        this.logger.info(`Action from Slack: ${action.action_id}`);
        super.receivedMessage(body.user.id, body.channel.id, body.team.id, `${action.action_id} ${checkedValues.join(" ")}`);
      }
    });

    // this.bot.on("start", () => {
    //   this.logger.info('Connected to Slack');
    //   this.logger.info('Logged in as: ');
    //   this.logger.info(`${this.bot.self.name} - (${this.bot.self.id})`);
    //   super.initialized();
    // });
    
    // this.bot.on("message", (message) => {
    //   if(message.type === "message" && message.text && this.isCommand(message.text)) {
    //     this.logger.info(`From Slack: ${message.text}`);
    //     super.receivedMessage(message.user, message.channel, message.team, message.text);
    //   }
    // });

    // this.bot.on("error", (err) => {
    //   this.logger.error("Error connecting to Slack!");
    //   this.logger.error(err);
    // });
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

  async sendMessage(channelID, message) {
    if(typeof message === 'string' || message instanceof String) {
      await this.bot.client.chat.postMessage({
        text: message,
        "unfurl_links": true,
        "unfurl_media": true,
        channel: channelID
      });
    } else {
      await this.bot.client.chat.postMessage({
        blocks: message,
        "unfurl_links": true,
        "unfurl_media": true,
        channel: channelID
      });
    }
    // this.bot.postMessage(channelID, message, { as_user: false, username: username, icon_url: iconUrl });
  }

  async sendMessageToUser(userId, message) {
    if(typeof message === 'string' || message instanceof String) {
      await this.bot.client.chat.postMessage({
        text: message,
        "unfurl_links": true,
        "unfurl_media": true,
        channel: channelID
      });
    } else {
      await this.bot.client.chat.postMessage({
        blocks: message,
        "unfurl_links": true,
        "unfurl_media": true,
        channel: channelID
      });
    }
    // this.bot.postMessage(userId, message, { as_user: false, username: username, icon_url: iconUrl });
  }
};