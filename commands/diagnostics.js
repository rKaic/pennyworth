const _ = require('lodash');
const core = require("../core.js");

module.exports = (logger, repo, botManager) => {
  let module = {};

  module.greet = (params, bot, userID, channelID, callback) => {
    callback(`Welcome to the Batcave, Sir`);
  };

  module.ping = (params, bot, userID, channelID, callback) => {
    callback("pong");
  };

  module.whoisbatman = (params, bot, userID, channelID, callback) => {
    var allUsers = _.filter(bot.getUsers(), (u) => { return u !== bot.username});
    allUsers.push("Bruce Wayne");
    var randomUser = core.random(allUsers);
    callback(`${randomUser} is Batman.`);
  }

  module.channels = (params, bot, userID, channelID, callback) => {
    callback(`\`\`\`${JSON.stringify(bot.getChannels(), null, 2)}\`\`\``);
  }

  module.die = (params, bot, userID, channelID, callback) => {
    callback("Shutting down...");
    process.exit();
  }

  return module;
}