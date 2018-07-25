const logger = require('winston');
const _ = require('lodash');
const glob = require( 'glob' );
const path = require( 'path' );
const DiscordBot = require('./bots/DiscordBot.js');
const SlackBot = require('./bots/SlackBot.js');
const BotManager = require('./bots/BotManager.js');
const Repository = require('./Repository.js');

// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(logger.transports.Console, {
    colorize: true
});
logger.level = 'debug';

const repo = new Repository(logger);
const botManager = new BotManager(logger);
botManager.addBot(new DiscordBot(logger, repo));
botManager.addBot(new SlackBot(logger, repo));
const bots = botManager.getAllBots();

const commands = {
  help: function(params, bot, userID, channelID, serverID, callback) {
    try {
      let allCommands = _.sortBy(_.filter(Object.keys(commands), (c) => { return !c.match(/^risky.*/) && (params.length === 0 || RegExp(`.*${params[0]}.*`).test(c)); }), (c) => { return c; });
      callback(`Available commands:\n${allCommands.join("    \n")}`);
    } catch(err) {
      logger.error(err);
      callback("No commands matching that pattern could be found!");
    }
  }
};
// https://stackoverflow.com/a/28976201/1451556
glob.sync( './commands/*.js' ).forEach( function( file ) {
  let commandModule = require( path.resolve( file ) )(logger, repo, botManager);
  for(let cmd in commandModule) {
    if(commandModule.hasOwnProperty(cmd)) {
      if(commands.hasOwnProperty(cmd)) {
        logger.warn(`Overwriting command ${cmd}`);
      }
      commands[cmd] = commandModule[cmd];
    }
  }
});

function initializePolling() {
  logger.info('Initializing polling...');
  glob.sync( './polls/*.js' ).forEach( function( file ) {
    let poll = require( path.resolve( file ) )(bots, logger, repo, botManager);
    if(typeof poll["initialize"] === "function") {
      poll.initialize();
    } else {
      logger.error(`Failed to initialize ${file}. Ensure that it is exporting an initialize() function.`);
    }
  });
}

let numBotsInitialized = 0;
function botInitialized() {
  numBotsInitialized++;
  if(numBotsInitialized === bots.length) {
    initializePolling();
  }
}

// Initialize the bots
for(let bot of bots) {
  bot.on("initialized", botInitialized);
  bot.initialize();
  bot.on("message", (userID, channelID, serverID, command, params, bot) => {
    logger.info(JSON.stringify({userID, channelID, serverID, command, params}));
    if(commands.hasOwnProperty(command.toLowerCase())) {
      // Record the command for stat tracking
      var commandEntry = {
        command: command,
        params: params,
        userID: userID,
        type: "command",
        botType: bot.getBotType(),
        channelID: channelID,
        serverID: serverID
      };
      repo.add(commandEntry, (err, c) => {
        if(err) {
          logger.error(err);
          return;
        }
      });

      // Then run the command
      commands[command](params, bot, userID, channelID, serverID, (message) => {
        bot.sendMessage(channelID, message);
      });
    }
  })
}