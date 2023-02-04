import { Logger } from "winston";
import _ from 'lodash';
import { BotType, ChannelType, FormattedMessage, MessageConfirmation } from "../Types";
import Bot from "./Bot";

class BotManager {
  logger: Logger;
  bots: Bot[];

  constructor(logger: Logger) {
    this.logger = logger;
    this.bots = [];
  }

  addBot(bot: Bot): void {
    this.bots.push(bot);
  }

  // TODO - This should really return an array of bots, as Pennyworth supports multiple bots of each type
  getBot(botType: BotType): Bot | undefined {
    return _.first(_.filter(this.bots, (bot) => { return bot.getBotType() === botType; }));
  }

  getAllBots(): Bot[] {
    return this.bots;
  }

  sendMessagesToAllBots = async (messages: FormattedMessage[], channelType: ChannelType): Promise<MessageConfirmation[]> => {
      const bots = this.getAllBots();
      return await Promise.all(bots.map(bot => bot.sendMessageToChannelType(messages, channelType)));
  }

  sendMessagesToBot = async (messages: FormattedMessage[], botType: BotType, channelType: ChannelType, threadID?: string): Promise<MessageConfirmation> => {
      const bot = this.getBot(botType);
      if(bot) {
          return await bot.sendMessageToChannelType(messages, channelType, threadID);
      }
      return {
          success: false,
          botType,
          channelID: '',
          threadID,
          userID: ''
      };
  }
}

export default BotManager;