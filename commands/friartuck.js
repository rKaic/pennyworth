const core = require("../core.js");

const friars = [
  "https://i.imgur.com/7yMprSm.jpg",
  "https://i.imgur.com/LmwlXVI.jpg",
  "https://i.imgur.com/ffrQQzL.jpg",
  "https://i.imgur.com/71ECGDY.jpg",
  "https://i.imgur.com/jfloyxw.jpg",
  "https://i.imgur.com/SIgHMYr.jpg"
];

module.exports = (logger, repo, botManager) => {
  function getFriarTuck(params, bot, userID, channelID, callback) {
    let randomImage = core.random(friars);
    callback(randomImage);
  }

  let module = {
    friartuck: getFriarTuck,
    tuckit: getFriarTuck,
    friar: getFriarTuck
  };

  return module;
}