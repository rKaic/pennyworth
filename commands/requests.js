const auth = require('../auth.js');
const _ = require('lodash');

const requestEntryType = "request";
const defectEntryType = "defect";
const validVerbs = ["new", "view", "edit", "delete"];

function buildQuery(entryType, userID, entryId) {
  let query = { type: entryType };

  if(entryId) {
    query["_id"] = entryId;
  }

  // Administrators have full permissions for all requests and features
  if(!_.includes(auth.users.getAdministrators(), userID)) {
    query.userID = userID;
  }

  return query;
}

module.exports = (logger, repo, botManager) => {
  let module = {};

  module.requests = (params, bot, userID, channelID, serverID, callback) => {
    repo.find(buildQuery(requestEntryType, userID), (err, docs) => {
      if(err || docs.length === 0) {
        err && this.logger.error(err);
        callback(`I was unable to find any requests`);
        return;
      }

      let usersRequests = _.map(docs, (r) => { 
        return {
          request: r.request, 
          id: r._id
        }; 
      });
      let requestsMessage = usersRequests.length > 0 ? `\`\`\`${JSON.stringify(usersRequests, null, 2)}\`\`\`` : "You have no open requests at this time.";
      callback(requestsMessage);
    });
  };

  module.defects = (params, bot, userID, channelID, serverID, callback) => {
    repo.find(buildQuery(defectEntryType, userID), (err, docs) => {
      if(err || docs.length === 0) {
        err && this.logger.error(err);
        callback(`I was unable to find any defects`);
        return;
      }

      let usersDefects = _.map(docs, (r) => { 
        return {
          defect: r.defect, 
          id: r._id
        }; 
      });
      let defectsMessage = usersDefects.length > 0 ? `\`\`\`${JSON.stringify(usersDefects, null, 2)}\`\`\`` : "You have no open defects at this time.";
      callback(defectsMessage);
    });
  };
    
  module.request = (params, bot, userID, channelID, serverID, callback) => {
    if(params.length < 2 || !_.includes(validVerbs, params[0])) {
      callback(`Usage: \`\`\`!request <${validVerbs.join("|")}> <feature idea> \`\`\``);
      return;
    }
    
    switch(params[0].toLowerCase()) {
      case "new":
        // Record the request
        let requestEntry = {
          request: params.slice(1).join(" "),
          userID: userID,
          type: requestEntryType,
          botType: bot.getBotType()
        };
        repo.add(requestEntry, (err, r) => {
          if(err) {
            logger.error(err);
            return;
          }
    
    
          let requestCommands = [`!request view ${r._id}`, `!request edit ${r._id} <new description>`, `!request delete ${r._id}`];
          callback(`Thank you! I have recorded your feature request. You can view or modify it via \`\`\`${requestCommands.join("\n")}\`\`\``);
        });
        break;
      case "view":
        let viewRequestId = params[1];
        repo.find(buildQuery(requestEntryType, userID, viewRequestId), (err, docs) => {
          if(err || docs.length === 0) {
            err && this.logger.error(err);
            callback(`I was unable to find a request with an ID of ${viewRequestId}`);
            return;
          }

          callback(`Your request: \`\`\`${_.first(docs).request}\`\`\``);
        });
        break;
      case "edit":
      let updateRequestId = params[1];
      let updatedRequestText = params.slice(2).join(" ");
      repo.update(buildQuery(requestEntryType, userID, updateRequestId), { request: updatedRequestText }, (err, numAffected, affectedDocuments) => {
        if(err || numAffected === 0) {
          err && this.logger.error(err);
          callback(`I was unable to update a request with an ID of ${updateRequestId}`);
          return;
        }

        callback(`Updated request \`\`\`${updateRequestId}\`\`\` to \`\`\`${updatedDefectText}\`\`\``);
      });
        break;
      case "delete":
        let deleteRequestId = params[1];
        repo.removeByQuery(buildQuery(requestEntryType, userID, deleteRequestId), (err, numRemoved) => {
          if(err) {
            callback("I'm sorry, but there was an error when deleting that request. Please check my error logs.");
            return;
          }
          
          callback(`Deleted request \`${deleteRequestId}\``);
        });
        break;
      default:
        callback(`${params[0]} hasn't been properly implemented like it should have been; go yell at your admin.`);
        return;
    }
  };
  
  module.defect = (params, bot, userID, channelID, serverID, callback) => {
    if(params.length < 2 || !_.includes(validVerbs, params[0])) {
      callback(`Usage: \`\`\`!defect <${validVerbs.join("|")}> <description> \`\`\``);
      return;
    }
    
    switch(params[0].toLowerCase()) {
      case "new":
        // Record the defect
        let defectEntry = {
          defect: params.join(" "),
          userID: userID,
          type: defectEntryType,
          botType: bot.getBotType()
        };
        repo.add(defectEntry, (err, d) => {
          if(err) {
            logger.error(err);
            return;
          }
    
          let defectCommands = [`!defect view ${d._id}`, `!defect edit ${d._id} <new description>`, `!defect delete ${d._id}`];
          callback(`Thank you! I have recorded your defect report. You can view or modify it via \`\`\`${defectCommands.join("\n")}\`\`\``);
        });
        break;
      case "view":
        let viewDefectId = params[1];
        repo.find(buildQuery(defectEntryType, userID, viewDefectId), (err, docs) => {
          if(err || docs.length === 0) {
            err && this.logger.error(err);
            callback(`I was unable to find a defect with an ID of ${viewDefectId}`);
            return;
          }

          callback(`Your request: \`\`\`${_.first(docs).request}\`\`\``);
        });
        break;
      case "edit":
        let updateDefectId = params[1];
        let updatedDefectText = params.slice(2).join(" ");
        repo.update(buildQuery(defectEntryType, userID, updateDefectId), { defect: updatedDefectText }, (err, numAffected, affectedDocuments) => {
          if(err || numAffected === 0) {
            err && this.logger.error(err);
            callback(`I was unable to update a defect with an ID of ${updateDefectId}`);
            return;
          }

          callback(`Updated defect \`\`\`${updateDefectId}\`\`\` to \`\`\`${updatedDefectText}\`\`\``);
        });
        break;
      case "delete":
        let deleteDefectId = params[1];
        repo.removeByQuery(buildQuery(defectEntryType, userID, deleteDefectId), (err, numRemoved) => {
          if(err) {
            callback("I'm sorry, but there was an error when clearing that defect. Please check my error logs.");
            return;
          }
          
          callback(`Cleared defect \`${deleteDefectId}\``);
        });
        break;
      default:
        callback(`${params[0]} hasn't been properly implemented like it should have been; go yell at your admin.`);
        return;
    }
  };

  return module;
}