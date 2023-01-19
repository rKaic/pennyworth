const core = require("../core.js");

const videos = {
  no: "https://www.youtube.com/watch?v=WWaLxFIVX1s",
  doIt: [
    "https://www.youtube.com/watch?v=10DQeSk1LaY",
    "https://www.youtube.com/watch?v=1zdNoVd2zOk"
  ]
};

const archivesIncomplete = "https://i.imgur.com/cpjE4PL.jpg";

module.exports = (logger, repo, botManager) => {
  let module = {};

  module.video = (params, bot, userID, channelID, serverID, respond) => {
    if(params.length > 0) {
      if(videos.hasOwnProperty(params[0])) {
        var video = videos[params[0]];
        if(Array.isArray(video)) {
          respond(core.random(video));
        } else {
          respond(video);
        }
      } else {
        respond(`I couldn't find that video... ${archivesIncomplete}`);
      }
    } else {
      respond(`Usage: \`\`\`!video <videoName>\`\`\``);
    }
  }

  module.videos = (params, bot, userID, channelID, serverID, respond) => {
    respond(Object.keys(videos).join("\n"));
  }

  return module;
}