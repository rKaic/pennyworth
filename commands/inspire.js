const request = require('request');

module.exports = (logger, repo, botManager) => {
  let module = {
    inspire: (params, bot, userID, channelID, serverID, respond) => {
      request({
        url: "http://inspirobot.me/api?generate=true"
      }, function(error, response, body) {
        if(error) {
          respond(`An error occurred, sir.\n\n + ${error}`);
        } else {
          respond(body);
        }
      });
    }
  };

  return module;
}