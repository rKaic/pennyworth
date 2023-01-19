const _ = require('lodash');
const core = require("../core.js");

module.exports = (logger, repo, botManager) => {
  let module = {};

  module.greet = (params, bot, userID, channelID, serverID, respond) => {
    respond(`Welcome to the Batcave, Sir`);
  };

  module.ping = (params, bot, userID, channelID, serverID, respond) => {
    respond("pong");
  };

  module.whoisbatman = (params, bot, userID, channelID, serverID, respond) => {
    let allUsers = bot.getUserIds(serverID);
    let randomUserId = core.random(allUsers);
    let randomUser = bot.getUsernameById(randomUserId);
    respond(`${randomUser} is Batman.`);
  }

  module.die = (params, bot, userID, channelID, serverID, respond) => {
    respond("Shutting down...");
    process.exit();
  }

  return module;
}