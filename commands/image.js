module.exports = (logger, repo, botManager) => {
  let module = {};

  return module;
}

// const auth = require('../auth.js');
// const GoogleImages = require('google-images');
// const imageClient = new GoogleImages(auth.googleImages.getEngineId(), auth.googleImages.getApiKey());
// const core = require("../core.js");

// module.exports = (logger, repo, botManager) => {
//   let module = {};

//   module.image = (params, bot, userID, channelID, serverID, respond) => {
//     if(params.length === 0) {
//       respond(`Usage: \`\`\`!image <search term>\`\`\``);
//       return;
//     }

//     imageClient.search(params.join(" "), { safe: "high" }).then(images => {
//       if(images.length > 0) {
//         let randomImage = core.random(images);
//         respond(randomImage.url);
//       } else {
//         respond(`I'm sorry, Sir, but nothing appears in the archives for that search term. https://i.imgur.com/cpjE4PL.jpg`)
//       }
//     });
//   };

//   module.riskyimage = (params, bot, userID, channelID, serverID, respond) => {
//     if(params.length === 0) {
//       respond(`Usage: \`\`\`!riskyimage <search term>\`\`\``);
//       return;
//     }

//     imageClient.search(params.join(" "), { safe: "off" }).then(images => {
//       if(images.length > 0) {
//         let randomImage = core.random(images);
//         respond(randomImage.url);
//       }
//     });
//   };

//   return module;
// }