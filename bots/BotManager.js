const _ = require('lodash');

class BotManager {
  constructor(logger) {
    this.logger = logger;
    this.bots = [];
  }

  addBot(bot) {
    this.bots.push(bot);
  }

  getBot(botType) {
    return _.first(_.filter(this.bots, (bot) => { return bot.getBotType() === botType; }));
  }

  getAllBots() {
    return this.bots;
  }
}

module.exports = BotManager;