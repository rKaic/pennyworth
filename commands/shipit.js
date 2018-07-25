const core = require("../core.js");

const squirrels = [
  "https://static1.squarespace.com/static/4ea1a968d09ac4c7fce27f76/t/504a4f63e4b0a70fa335886c/1347047268084/?format=1000w",
  "http://shipitsquirrel.github.io/images/ship%20it%20squirrel.png",
  "http://28.media.tumblr.com/tumblr_lybw63nzPp1r5bvcto1_500.jpg",
  "http://i.imgur.com/DPVM1.png",
  "http://d2f8dzk2mhcqts.cloudfront.net/0772_PEW_Roundup/09_Squirrel.jpg",
  "http://www.cybersalt.org/images/funnypictures/s/supersquirrel.jpg",
  "http://www.zmescience.com/wp-content/uploads/2010/09/squirrel.jpg",
  "http://1.bp.blogspot.com/_v0neUj-VDa4/TFBEbqFQcII/AAAAAAAAFBU/E8kPNmF1h1E/s640/squirrelbacca-thumb.jpg"
];

module.exports = (logger, repo, botManager) => {
  let module = {
    shipit: (params, bot, userID, channelID, callback) => {
      let randomImage = core.random(squirrels);
      callback(randomImage);
    }
  };

  return module;
}