const core = require("../core.js");

const thunks = [
  "https://i.imgur.com/uq7lIwd.gif",
  "https://i.imgur.com/eCJVS64.gif",
  "https://i.imgur.com/fkN1EWj.gifv",
  "https://i.imgur.com/91VpvOy.gif"
];

module.exports = (logger, repo, botManager) => {
  let module = {
    thinking: (params, bot, userID, channelID, serverID, respond) => {
      let randomImage = core.random(thunks);
      respond(randomImage);
    }
  };

  return module;
}