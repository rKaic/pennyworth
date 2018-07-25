const auth = require('../auth.json');
const _ = require('lodash');
const core = require("../core.js");

module.exports = (logger, repo, botManager) => {
  let module = {};

  module.greet = (params, bot, userID, channelID, serverID, callback) => {
    callback(`Welcome to the Batcave, Sir`);
  };

  module.ping = (params, bot, userID, channelID, serverID, callback) => {
    callback("pong");
  };

  module.whoisbatman = (params, bot, userID, channelID, serverID, callback) => {
    let allUsers = bot.getUserIds(serverID);
    let randomUserId = core.random(allUsers);
    let randomUser = bot.getUsernameById(randomUserId);
    callback(`${randomUser} is Batman.`);
  }

  module.channels = (params, bot, userID, channelID, serverID, callback) => {
    if(!_.includes(auth.administrators, userID)) {
      callback("I'm sorry, but Master Wayne hasn't given you permission to do that.");
      return;
    }

    callback(`\`\`\`${JSON.stringify(bot.getChannels(serverID), null, 2)}\`\`\``);
  }

  module.die = (params, bot, userID, channelID, serverID, callback) => {
    callback("Shutting down...");
    process.exit();
  }

  return module;
}