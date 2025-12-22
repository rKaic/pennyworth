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

    this.bot.on('voiceCommand', async (results: any) => {
        this.logger.info(`From Voice: ${results}`);
        // TODO - Remove or change this
        await this.bot.sendMessage(null, "Understood, sir.");
        // if (this.isVoiceCommand(results)) {
        //   super.receivedMessage({userID, channelID: data.channelID, threadID: message.ts, serverID: data.serverID, message});
        // }
    });
  }

  async sendMessage(channelID: string, message: string | FormattedMessage[], threadID?: string): Promise<MessageConfirmation> {
    return await this.bot.sendMessage(channelID, message);
  }

  shutdown() {
    this.bot.stop();
  }
};

export default VoiceBot;