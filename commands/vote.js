const _ = require('lodash');

const emojis = [":thumbsup:", ":star:", ":fire:"];

// TODO - Figure out how to finish this
module.exports = (logger, repo, botManager) => {
  let module = {
    vote: (params, bot, userID, channelID, callback) => {
      let options = params.join(" ").split(",");
      if(options.length < 2) {
        callback("Usage: \`\`\`!vote <option>, <option>[, <option>]\`\`\`");
        return;
      }

      let message = [];
      for(let i = 0; i < options.length; i++) {
        message.push(`To vote for ${options[i].trim()}, react using ${emojis[i]}.`);
      }

      callback(message.join(" "));

      setTimeout(() => {
        callback("Running out of time to vote!");
        setTimeout(() => {
          callback("Vote's done! I wonder who won...");
        }, 10000);
      }, 10000);
    }
  };

  return module;
}