import { chunk } from '../core';
import { BotType, ButtonFormat, ChannelType, Checkbox, FormattedMessage, MessageConfirmation, MessageFormat } from '../Types';
import Bot from './Bot';
import { App } from '@slack/bolt';
import _, { trimEnd } from 'lodash';
import { Logger } from 'winston';
import Repository from '../Repository';
import { slack } from '../auth';

const iconUrl: string = "https://i.imgur.com/xsnGmvC.jpg";
const username: string = "Pennyworth";

const MAX_NUM_BLOCKS: number = 50;

type SlackMessageConfirmation = {
  channel: string,
  message: {
    app_id: string,
    blocks: any[],
    bot_id: string,
    bot_profile: any,
    team: string,
    text: string,
    ts: string,
    thread_ts: string,
    type: string,
    user: string
  },
  ok: boolean,
  response_metadata: any,
  ts: string
};

class SlackBot extends Bot {
  _appToken: string;
  _botToken: string;

  constructor(logger: Logger, repo: Repository, botToken: string, appToken: string, signingSecret: string) {
    let bot = new App({
      appToken: appToken,
      token: botToken,
      signingSecret: signingSecret,
      socketMode: true
    });
    super(bot, BotType.Slack, logger, repo);
    this._appToken = appToken;
    this._botToken = botToken;
    this._formatMessage.bind(this);
  }

  initialize() {
    super.initialize();

    (async () => {
      // The port the socket is connecting on
      const port = 3000
      await this.bot.start(process.env.PORT || port);
      this.logger.info(`⚡️ ${this.getFullName()} is running on port ${port}!`);
      super.initialized();
    })();

    this.bot.message(/!.*/, async ({message, say}) => {
      if(message.type === "message" && message.text && this.isCommand(message.text)) {
        this.logger.info(`Message from Slack: ${message.text}`);
        super.receivedMessage({
          userID: message.user, 
          channelID: message.channel, 
          threadID: message.ts, 
          messageID: message.ts,
          serverID: message.team,
          message: message.text
        });
      }
    });

    this.bot.command(/\/.*/, async ({ command, ack, say }) => {
      await ack();
      const rawCommand = command.command.replace('/', '');
      if(rawCommand) {
        this.logger.info(`Command from Slack: ${command.command}`);
        const confirmation = await this.sendMessage(command.channel_id, `:face_with_monocle: Processing \`${rawCommand}\` command...`); 

        super.receivedMessage({
          userID: command.user_id, 
          channelID: command.channel_id,
          threadID: confirmation.threadID,
          messageID: confirmation.messageID,
          serverID: command.team_id, 
          message: `${rawCommand} ${command.text}`
        });
      }
    });

    this.bot.action(/.*/, async ({ action, body, ack, say }) => {
      await ack();

      // TODO - This is fragile
      const selectedValues = Object.values(body.state.values).flatMap((val:any) => 
        Object.keys(val).filter((key: string) => key.startsWith("action_select_")).map((key: string) => 
            val[key].selected_option?.value));
      const checkedValues = Object.values(body.state.values).flatMap((val:any) => 
        Object.keys(val).filter((key: string) => key.startsWith("action_check")).map((key: string) => 
            val[key].selected_options?.map(opt => opt.value)));
      if(action.action_id) {
        this.logger.info(`Action from Slack: ${action.action_id}`);
        super.receivedMessage({
          userID: body.user.id, 
          channelID: body.channel.id, 
          threadID: body.message.thread_ts,
          messageID: body.message.ts,
          serverID: body.team.id,
          message: `${action.action_id} ${action.value} ${selectedValues.join(" ")} ${checkedValues.join(" ")}`
        });
      }
    });
    
  }

  getName(): string {
    return username;
  }

  getFullName(): string {
    return `${username} (${BotType[this.getBotType()]})`;
  }

  getId(): string {
    return this.bot.self.id;
  }

  getChannels(serverID: string): { id: string, name: string }[] {
    return _.map(this.bot.channels, (c) => { return { id: c.id, name: c.name }; });
  }

  getUsernameById(userID: string): string {
    return _.find(this.bot.users, (u) => { return u.id === userID; }).real_name;
  }

  getUserIds(serverID: string): string[] {
    return _.map(this.bot.users, (u) => { return u.id; });
  }

  async _sendTextMessage(channelID: string, message: string, threadID?: string): Promise<SlackMessageConfirmation> {
    return await this.bot.client.chat.postMessage({
      text: message,
      unfurl_links: true,
      unfurl_media: true,
      channel: channelID,
      thread_ts: threadID
    });
  }

  async _sendFormattedMessage(channelID: string, blocks: FormattedMessage[], threadID?: string): Promise<SlackMessageConfirmation> {
    const chunks = chunk(blocks, MAX_NUM_BLOCKS);
    const chunkConfirmations: SlackMessageConfirmation[] = [];
    for(let chunk of chunks) {
      chunkConfirmations.push(
        await this.bot.client.chat.postMessage({
          text: chunk[0].text,
          blocks: chunk.map(this._formatMessage.bind(this)),
          unfurl_links: true,
          unfurl_media: true,
          channel: channelID,
          thread_ts: threadID
        })
      );
    }
    return chunkConfirmations[0];
  }

  async _sendSlackMessage(channelID: string, message: string | FormattedMessage[], threadID?: string): Promise<MessageConfirmation> {
    try {
      return this._toMessageConfirmation((typeof message === 'string' || message instanceof String) ? 
        await this._sendTextMessage(channelID, message as string, threadID) :
        await this._sendFormattedMessage(channelID, message, threadID));
    } catch (err) {
      this.logger.error(`Error sending Slack Message: ${err.message}`);
      return {
        success: false,
        botType: this.botType,
        userID: '',
        channelID: channelID,
        threadID: threadID
      };
    }
  }

  async sendMessage(channelID: string, message: string | FormattedMessage[], threadID?: string): Promise<MessageConfirmation> {
    return await this._sendSlackMessage(channelID, message, threadID);
  }

  async sendMessageToUser(userID: string, message: string | FormattedMessage[], threadID?: string): Promise<MessageConfirmation> {
    return await this._sendSlackMessage(userID, message, threadID);
  }

  async sendMessageToChannelType(message: string | FormattedMessage[], channelType: ChannelType, threadID?: string): Promise<MessageConfirmation> {
    let channel: { serverID?: string, channelID?: string } | undefined;
    switch(channelType) {
      case ChannelType.Admininstrators: channel = await slack.getAdminChannel(); break;
      case ChannelType.Developers: channel = await slack.getDeveloperChannel(); break;
    }
    if(channel && channel.channelID) {
      return await this.sendMessage(channel.channelID, message, threadID);
    }
    return {
      success: false,
      botType: this.botType,
      userID: '',
      channelID: '',
      threadID: ''
    };
  }

  async sendMessageToDevelopers(message: string | FormattedMessage[], threadID?: string): Promise<MessageConfirmation> {
    const devChannel = await slack.getDeveloperChannel();
    if(devChannel.channelID) {
      return await this.sendMessage(devChannel.channelID, message, threadID);
    }
    return {
      success: false,
      botType: this.botType,
      userID: '',
      channelID: '',
      threadID: ''
    };
  }

  async _updateTextMessage(channelID: string, message: string, messageID: string): Promise<SlackMessageConfirmation> {
    return await this.bot.client.chat.update({
      token: this._botToken,
      as_user: true,
      text: message,
      blocks: [],
      channel: channelID,
      ts: messageID
    });
  }

  async _updateFormattedMessage(channelID: string, blocks: FormattedMessage[], messageID: string): Promise<SlackMessageConfirmation> {
    const chunks = chunk(blocks, MAX_NUM_BLOCKS);
    const chunkConfirmations = await Promise.all(chunks.map(chunk => this.bot.client.chat.update({
      token: this._botToken,
      as_user: true,
      text: chunk[0].text,
      blocks: chunk.map(this._formatMessage.bind(this)),
      channel: channelID,
      ts: messageID
    })));
    return chunkConfirmations[0];
  }

  async _updateSlackMessage(channelID: string, message: string | FormattedMessage[], messageID: string): Promise<MessageConfirmation> {
    try {
      return this._toMessageConfirmation((typeof message === 'string' || message instanceof String) ? 
        await this._updateTextMessage(channelID, message as string, messageID) :
        await this._updateFormattedMessage(channelID, message, messageID));
    } catch (err) {
      this.logger.error(`Error updating Slack Message: ${err.message}`);
      return {
        success: false,
        botType: this.botType,
        userID: '',
        channelID: channelID,
        threadID: messageID
      };
    }
  }

  async updateMessage(channelID: string, message: string | FormattedMessage[], messageID: string): Promise<MessageConfirmation> {
    return await this._updateSlackMessage(channelID, message, messageID);
  }

  _toMessageConfirmation(slackConfirmation: SlackMessageConfirmation): MessageConfirmation {
    return {
      success: slackConfirmation.ok,
      botType: this.botType,
      channelID: slackConfirmation.channel,
      threadID: slackConfirmation.ts,
      messageID: slackConfirmation.message.ts || slackConfirmation.message.thread_ts,
      userID: slackConfirmation.message.user
    };
  }

  _formatMessage(message: FormattedMessage) {
    switch(message.format) {
      case MessageFormat.Header:
        return {
          type: "header",
          text: {
              type: "plain_text",
              text: message.text
          }
        };
      case MessageFormat.Markdown:
        return {
          type: "section",
          text: {
            type: "mrkdwn",
            text: message.text
          },
          accessory: message.data ? this._formatMessage.bind(this)(message.data) : undefined
        };
      case MessageFormat.Divider:
        return {
          type: "divider"
        };
      case MessageFormat.Context:
        return {
          type: "context",
          elements: message.data?.map(this._formatMessage.bind(this))
        };
      case MessageFormat.Image:
        return {
          type: "image",
          image_url: message.text,
          alt_text: message.data
        };
      case MessageFormat.Subtext:
        return {
          type: "mrkdwn",
          text: message.text
        };
      case MessageFormat.Button:
        return {
          type: "button",
          text: {
            type: "plain_text",
            text: message.text
          },
          action_id: message.data.actionId,
          value: message.data.value,
          style: this._getButtonStyle.bind(this)(message.data?.buttonFormat),
          confirm: message.data.confirmation ? {
              title: {
                type: "plain_text",
                text: message.data.confirmation.title
              },
              text: {
                type: "plain_text",
                text: message.data.confirmation.text
              },
              confirm: {
                type: "plain_text",
                text: message.data.confirmation.yes
              },
              deny: {
                type: "plain_text",
                text: message.data.confirmation.no
              }
          } : undefined
        };
      case MessageFormat.Checkboxes: 
        return {
          type: "checkboxes",
          options: message.data.map(this._formatCheckbox.bind(this)),
          initial_options: message.data.filter((c: Checkbox) => c.selected).map(this._formatCheckbox.bind(this)),
          action_id: message.text
        };
      case MessageFormat.Actions:
        return {
          type: "actions",
          elements: message.data.map(this._formatMessage.bind(this))
        };
      case MessageFormat.Dropdown:
        return {
          type: "static_select",
          placeholder: {
            type: "plain_text",
            text: message.text,
            emoji: true
          },
          options: message.data.options.map(opt => ({
            text: {
              type: "plain_text",
              text: `${opt}`,
              emoji: true
            },
            value: `${opt}`
          })),
          initial_option: message.data.initial ? {
            text: {
              type: "plain_text",
              text: message.data.initial,
              emoji: true
            },
            value: message.data.initial
          } : undefined,
          action_id: message.data.actionId
        };
    }
  }

  _formatCheckbox(checkbox: Checkbox) {
    return {
      text: {
        type: "mrkdwn",
        text: checkbox.title
      },
      description: {
        type: "mrkdwn",
        text: checkbox.description
      },
      value: checkbox.value
    }
  };

  _getButtonStyle(format: ButtonFormat): string | null {
    switch(format) {
      case ButtonFormat.Primary: return "primary";
      case ButtonFormat.Danger: return "danger";
      case ButtonFormat.Standard:
      default: return null;
    }
  }
};

export default SlackBot;