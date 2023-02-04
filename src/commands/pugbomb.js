const core = require("../core.js");

const maxPugsToBomb = 5;
const pugs = [
  "https://i.imgur.com/ZAg7AaU.jpg",
  "https://i.imgur.com/4cIl0R9.jpg",
  "https://i.imgur.com/hQ7y04r.jpg",
  "http://i.imgur.com/HZUxm.jpg",
  "http://i.imgur.com/Us9gGWv.png",
  "https://i.imgur.com/qySRqvi.jpg",
  "https://i.imgur.com/1UWvHzo.jpg",
  "https://i.imgur.com/C8VPyyG.jpg",
  "https://i.imgur.com/g0qYqwO.jpg",
  "https://i.imgur.com/ZBrkcdi.gif",
  "https://i.imgur.com/ZBrkcdi.gif",
  "https://i.imgur.com/ZBrkcdi.gif",
  "https://i.imgur.com/ZBrkcdi.gif",
  "https://i.imgur.com/ZBrkcdi.gif"
];

module.exports = (logger, repo, botManager) => {
  let module = {
    pugbomb: (params, bot, userID, channelID, serverID, respond) => {
      for(let i = 0; i <= maxPugsToBomb; i++) {
        let randomPug = core.random(pugs);
        respond(randomPug);
      }
    }
  };

  return module;
}