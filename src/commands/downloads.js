const request = require('request-promise-native');
const _ = require('lodash');
const auth = require('../auth.json');
const { stringify } = require('../core.js');

const baseUrl = `http://localhost:5000/api`;

module.exports = (logger, repo, botManager) => {

    const addUriToQueue = (uris, callback) => {
      request({
        url: `${baseUrl}/Downloads/queue`,
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
            uris: uris
        })
      }, (error, response, body) => {
        if(error) {
          logger.error(error);
          callback("I failed to add the URL to my queue. Please check my error log.");
        }
    
        callback(null, body);
      });
    };

    let module = {
        download: (params, bot, userID, channelID, serverID, callback) => {
            if(!_.includes(auth.administrators, userID)) {
              callback(`I'm sorry, but Master Wayne hasn't given you permission to do that.`);
              return;
            }
            addUriToQueue(params, (err, processingDto) => {
                callback(err || `I've queued them up: \`\`\`${stringify(processingDto)}\`\`\``);
            });
        }
    };

    return module;
}