const request = require('request');

module.exports = (logger, repo, botManager) => {
  let module = {
    inspire: (params, bot, userID, channelID, serverID, callback) => {
      request({
        url: "http://inspirobot.me/api?generate=true"
      }, function(error, response, body) {
        if(error) {
          callback(`An error occurred, sir.\n\n + ${error}`);
        } else {
          callback(body);
        }
      });
    }
  };

  return module;
}