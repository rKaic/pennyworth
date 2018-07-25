const _ = require('lodash');
const moment = require('moment');

const commandEntryType = "command";

module.exports = (logger, repo, botManager) => {
  let module = {};

  const usageError = (callback) => {
    callback(`Usage: \`\`\`!stats <users|commands|mine> [today]\`\`\``);
  };

  module.stats = (params, bot, userID, channelID, serverID, callback) => {
    if(params.length == 0) {
      usageError(callback);
      return;
    }

    let query = { type: commandEntryType };
    let countByField = "command";
    switch(params[0].toLowerCase()) {
      case "users":
        countByField = "username";
        break;
      case "commands":
        countByField = "command";
        break;
      case "mine":
        query.userID = userID;
        break;
      default:
        usageError(callback);
        return;
    }

    if(params.length >= 2 && params[1].toLowerCase() === "today") {
      query.timestamp = { "$gte": moment.utc().format("YYYY-MM-DDT00:00:00") };
    }

    
    repo.find(query, (err, docs) => {
      if(err) {
        callback("I'm sorry, but there was an error when retrieving stats. Please check my error logs.");
        return;
      }

      let commands = _.countBy(_.map(docs, (c) => {
        let botForCommand = botManager.getBot(c.botType);
        let userForCommand = botForCommand.getUsernameById(c.userID);
        return {
          command: c.command, 
          id: c._id, 
          username: userForCommand,
          timestamp: c.timestamp
        }; 
      }), countByField);
      let statsMessage = `\`\`\`${JSON.stringify(commands, _.orderBy(Object.keys(commands), (c) => {return commands[c]}, "desc"), 2)}\`\`\``;
      callback(statsMessage);
    });
  };

  return module;
}