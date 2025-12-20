import { BotType, FormattedMessage, MessageConfirmation } from '../Types';
import Bot from './Bot';
import { Logger } from 'winston';
import Repository from '../Repository';
import VoiceClient from '../lib/voice';

class VoiceBot extends Bot {
  constructor(logger: Logger, repo: Repository) {
    let bot = new VoiceClient(logger);
    bot.start();
    super(bot, BotType.Voice, logger, repo);
  }

  initialize() {
    super.initialize();

    this.bot.on('voiceCommand', (results: any) => {
        // if (this.isCommand(results)) {
          this.logger.info(`From Voice: ${results?.text}`);
        //   super.receivedMessage({userID, channelID: data.channelID, threadID: message.ts, serverID: data.serverID, message});
        // }
    });
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
};

export default VoiceBot;