const auth = require('../auth.json');
const GoogleImages = require('google-images');
const imageClient = new GoogleImages(auth.googleImages.engineId, auth.googleImages.apiKey);
const core = require("../core.js");

module.exports = (logger, repo, botManager) => {
  let module = {};

  module.image = (params, bot, userID, channelID, serverID, callback) => {
    if(params.length === 0) {
      callback(`Usage: \`\`\`!image <search term>\`\`\``);
      return;
    }

    imageClient.search(params.join(" "), { safe: "high" }).then(images => {
      if(images.length > 0) {
        let randomImage = core.random(images);
        callback(randomImage.url);
      } else {
        callback(`I'm sorry, Sir, but nothing appears in the archives for that search term. https://i.imgur.com/cpjE4PL.jpg`)
      }
    });
  };

  module.riskyimage = (params, bot, userID, channelID, serverID, callback) => {
    if(params.length === 0) {
      callback(`Usage: \`\`\`!riskyimage <search term>\`\`\``);
      return;
    }

    imageClient.search(params.join(" "), { safe: "off" }).then(images => {
      if(images.length > 0) {
        let randomImage = core.random(images);
        callback(randomImage.url);
      }
    });
  };

  return module;
}