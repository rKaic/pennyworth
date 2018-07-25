const auth = require('../auth.json');
const _ = require('lodash');
const request = require('request');

const memeGenApiKey = auth.memeGen.apiKey;
const memes = [{
		regex: /(Y U NO) (.+)/i,
		generatorID: 2,
		imageID: 166088
	}, {
		regex: /(I DON'?T ALWAYS .*) (BUT WHEN I DO,? .*)/i,
		generatorID: 74,
		imageID: 2485
	}, {
		regex: /(.*)(O\s?RLY\??.*)/i,
		generatorID: 920,
		imageID: 117049
	}, {
		regex: /(.*)(SUCCESS|NAILED IT.*)/i,
		generatorID: 121,
		imageID: 1031
	}, {
		regex: /(.*) (ALL the .*)/i,
		generatorID: 6013,
		imageID: 1121885
	}, {
		regex: /(.*) (\w+\sTOO DAMN .*)/i,
		generatorID: 998,
		imageID: 203665
	}, {
		regex: /(GOOD NEWS EVERYONE[,.!]?) (.*)/i,
		generatorID: 1591,
		imageID: 112464
	}, {
		regex: /(NOT SURE IF .*) (OR .*)/i,
		generatorID: 305,
		imageID: 84688
	}, {
		regex: /(YO DAWG .*) (SO .*)/i,
		generatorID: 79,
		imageID: 108785
	}, {
		regex: /(ALL YOUR .*) (ARE BELONG TO US)/i,
		generatorID: 349058,
		imageID: 2079825
	}, {
		regex: /(.*) (FUCK YOU)/i,
		generatorID: 1189472,
		imageID: 5044147
	}, {
		regex: /(.*) (You'?re gonna have a bad time)/i,
		generatorID: 825296,
		imageID: 3786537
	}, {
		regex: /(one does not simply) (.*)/i,
		generatorID: 274947,
		imageID: 1865027
	}, {
		regex: /(grumpy cat) (.*),(.*)/i,
		generatorID: 1590955,
		imageID: 6541210
	}, {
		regex: /(it looks like you're|it looks like you) (.*)/i,
		generatorID: 20469,
		imageID: 1159769
	}, {
		regex: /(AM I THE ONLY ONE AROUND HERE) (.*)/i,
		generatorID: 953639,
		imageID: 4240352
	}, {
		regex: /(.*)(NOT IMPRESSED*)/i,
		generatorID: 1420809,
		imageID: 5883168
	}, {
		regex: /(PREPARE YOURSELF) (.*)/i,
		generatorID: 414926,
		imageID: 2295701
	}, {
		regex: /(WHAT IF I TOLD YOU) (.*)/i,
		generatorID: 1118843,
		imageID: 4796874
	}, {
		regex: /(.*) (BETTER DRINK MY OWN PISS)/i,
		generatorID: 92,
		imageID: 89714
	}, {
		regex: / ?INTERNET KID ?([^,]*),?(.*)/i,
		generatorID: 1095654,
		imageID: 4714007
	}, {
    // Spock Khan
		regex: /spock(?:ha|ah)nify (.*)/i,
		generatorID: 2103732,
		imageID: 8814557
  }, {
    // Kirk Khan
		regex: /k(?:ha|ah)nify (.*)/i,
		generatorID: 6443,
		imageID: 1123022
  }, {
    // Philosoraptor
		regex: /(IF .*), ((ARE|CAN|DO|DOES|HOW|IS|MAY|MIGHT|SHOULD|THEN|WHAT|WHEN|WHERE|WHICH|WHO|WHY|WILL|WON\'T|WOULD)[ \'N].*)/i,
		generatorID: 17,
		imageID: 984
  }, {
    // 
		regex: /((Oh|You) .*) ((Please|Tell) .*)/i,
		generatorID: 542616,
		imageID: 2729805
  }
];

module.exports = (logger, repo, botManager) => {
  let module = {
    meme: (params, bot, userID, channelID, callback) => {
      let memeText = params.join(" ");
      let validMeme = _.first(_.filter(memes, (m) => {return memeText.match(m.regex)}));
      if(typeof validMeme === "undefined") {
        return;
      }
      
      request({
        method: "POST",
        url: [
          "http://version1.api.memegenerator.net/Instance_Create",
          "?apiKey=",
          memeGenApiKey,
          "&languageCode=en",
          "&generatorID=",
          validMeme.generatorID,
          "&imageID=",
          validMeme.imageID,
          "&text0=",
          memeText.match(validMeme.regex)[1],
          "&text1=",
          memeText.match(validMeme.regex)[2]
        ].join("")
      }, (error, response, body) => {
        if(error) {
					callback(`An error occurred, sir.\n\n' ${error}`);
        } else {
          let instance = JSON.parse(body).result;
          let instanceUrl = instance.instanceUrl;
          let instanceId = instance.instanceID;
          let instanceImageUrl = instance.instanceImageUrl;
          request({
            url: instanceUrl
          }, ((instanceId, instanceImageUrl, error, response, body) => {
            setTimeout(() => {
							callback(instanceImageUrl);
            }, 5000);
          }).bind(null, instanceId, instanceImageUrl));
        }
      });
    }
  };

  return module;
}