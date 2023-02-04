import { BotType, ChannelType, CommandContext, FormattedMessage, MessageConfirmation, MessageContext } from '../Types';
import events from 'events';
import EventEmitter from 'events';
import { Logger } from 'winston';
import Repository from '../Repository';

class Bot extends EventEmitter {
  bot: any;
  botType: BotType;
  logger: Logger;
  commandParam: string;

  constructor(bot, botType: BotType, logger: Logger, repo: Repository) {
    super();

    this.bot = bot;
    this.botType = botType;
    this.logger = logger;
    this.commandParam = '!';
    events.EventEmitter.call(this);
  }

  initialize(): void {
  }

  initialized(): void {
    this.emit("initialized");
  }

  isCommand(message: string): boolean {
    return message.startsWith(this.commandParam);
  }

  getBotType(): BotType {
    return this.botType;
  }

  getName(): string {
    return '';
  }

  getFullName(): string {
    return `(${BotType[this.getBotType()]})`;
  }

  getId(): string {
    return '';
  }

  getChannels(serverID: string): { id: string, name: string }[] {
    return [];
  }

  getUsernameById(userID: string): string | null {
    return null;
  }

  getUserIds(serverID: string): string[] {
    return [];
  }

  async sendMessage(channelID: string, message: string | FormattedMessage[], threadID?: string): Promise<MessageConfirmation> {
    this.logger.info(JSON.stringify({channelID, threadID, message}));
    return {
      success: false,
      botType: this.botType,
      userID: '',
      channelID,
      threadID: threadID
    };
  }

  async sendMessageToUser(userID: string, message: string | FormattedMessage[], threadID?: string): Promise<MessageConfirmation> {
    this.logger.info(JSON.stringify({userID, threadID, message}));
    return {
      success: false,
      botType: this.botType,
      userID,
      channelID: '',
      threadID: threadID
    };
  }

  async sendMessageToChannelType(message: string | FormattedMessage[], channelType: ChannelType, threadID?: string): Promise<MessageConfirmation> {
    this.logger.info(JSON.stringify({message}));
    return {
      success: false,
      botType: this.botType,
      userID: '',
      channelID: '',
      threadID: threadID
    };
  }

  async updateMessage(channelID: string, message: string | FormattedMessage[], messageID: string): Promise<MessageConfirmation> {
    this.logger.info(JSON.stringify({channelID, messageID, message}));
    return {
      success: false,
      botType: this.botType,
      userID: '',
      channelID,
      threadID: messageID
    };
  }

  receivedMessage(context: MessageContext): void {
    let args = context.message.replace(this.commandParam, "").split(' ');
    let command = args[0];
    let params = args.slice(1).filter(a => a != "");
    this.emit("command", {
      userID: context.userID,
      channelID: context.channelID,
      threadID: context.threadID,
      messageID: context.messageID,
      serverID: context.serverID,
      command,
      params,
      bot: this
    } as CommandContext);
  }
};

export default Bot;