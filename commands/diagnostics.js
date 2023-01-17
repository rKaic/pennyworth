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

  module.die = (params, bot, userID, channelID, serverID, callback) => {
    callback("Shutting down...");
    process.exit();
  }

  return module;
}