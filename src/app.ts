import winston, { transports } from 'winston';
import _ from 'lodash';
import glob from 'glob';
import path from 'path';
import { discord, slack, repository } from './auth';
import health from './health';
import DiscordBot from './bots/DiscordBot';
import SlackBot from './bots/SlackBot';
import BotManager from './bots/BotManager';
import Repository from './Repository';
import { Command, CommandContext, CommandEntry, CommandModule, FormattedMessage, MessageConfirmation, MessageFormat, PollModule } from './Types';
import { formatMessage, getVersion, uuid } from './core';
import os from 'os';
import moment from 'moment';

(async () => {
  // Configure logger settings
  const logMetadata = ({
    appName: "Pennyworth",
    machineName: os.hostname(),
    version: getVersion()
  });
  const logger = winston.createLogger({
    defaultMeta: logMetadata,
    transports: [
      new transports.Console({
        format: winston.format.combine(
          winston.format.colorize({all: true})
        ), 
        level: 'debug'
      }), 
    ]
  });

  const connectionString = await repository.getConnectionString();
  if(!connectionString) {
    logger.error(`Repository connection string is required`);
    return 1;
  }
  const repo = new Repository(logger, connectionString);
  const botManager = new BotManager(logger);
  const discordTokens = await discord.getTokens();
  for(let discordToken of discordTokens) {
    logger.info("Initializing Discord Bot");
    botManager.addBot(new DiscordBot(logger, repo, discordToken));
  }
  const slackTokens = await slack.getConfigs();
  for(let slackConfig of slackTokens) {
    logger.info("Initializing Slack Bot");
    if(!slackConfig.botToken || !slackConfig.appToken || !slackConfig.signingSecret) {
      logger.error("BotToken, AppToken, and SigningSecret are required");
    }
    botManager.addBot(new SlackBot(logger, repo, slackConfig.botToken as string, slackConfig.appToken as string, slackConfig.signingSecret as string));
  }
  const bots = botManager.getAllBots();

  const commands: {[key: string]: CommandModule} = {
    help: {
      key: "help",
      aliases: [],
      execute: async function(command: Command) {
        try {
          const matchingCommands = _.sortBy(_.filter(Object.keys(commands), (c) => { return command.params.length === 0 || RegExp(`.*${command.params[0]}.*`).test(c); }).map(k => commands[k]).filter(c => c.help.displayAsCommand), (c) => { return c.key; });
          if(command.params.length === 0) {
            // Display a list of all commands
            await command.respond([
              formatMessage(MessageFormat.Header, "Available Commands"),
              ...matchingCommands.flatMap(c => ([
                formatMessage(MessageFormat.Markdown, `*${c.key}*`),
                formatMessage(MessageFormat.Context, '', [
                  formatMessage(MessageFormat.Subtext, `${c.help.description}`)
                ]),
              ])),
              formatMessage(MessageFormat.Divider),
              formatMessage(MessageFormat.Markdown, `Having problems? <https://github.com/eftours/air-slackbot/issues/new|Report an issue on GitHub>`)
            ]);
          } else {
            // Display only those selected commands in great detail
            await command.respond([
              formatMessage(MessageFormat.Header, `Commands Matching '${command.params[0]}'`),
              ...matchingCommands.flatMap(c => ([
                formatMessage(MessageFormat.Markdown, `*${c.key}*`),
                formatMessage(MessageFormat.Context, '', [
                  formatMessage(MessageFormat.Subtext, `Aliases: ${c.aliases.join(",")}`),
                  formatMessage(MessageFormat.Subtext, `Usage: ${command.bot.commandParam}${c.key} ${c.help.usage}`),
                  formatMessage(MessageFormat.Subtext, `Description: ${c.help.description}`)
                ]),
                formatMessage(MessageFormat.Divider)
              ])),
              formatMessage(MessageFormat.Markdown, `Having problems? <https://github.com/eftours/air-slackbot/issues/new|Report an issue on GitHub>`)
            ]);
          }
        } catch(err) {
          logger.error(err);
          await command.respond("No commands matching that pattern could be found!");
        }
      },
      help: {
        description: "Displays a list of available commands and their usage",
        displayAsCommand: true,
        usage: `[command]`
      }
    }
  };
  
  // https://stackoverflow.com/a/28976201/1451556
  glob.sync(path.join(__dirname, './commands/*.{ts,js}').replace(/\\/g, '/')).forEach(async (file: string) => {
    logger.info(`Loading commands from ${file}`);
    let commandModules: CommandModule[] = await import(path.resolve(file)).then(m => m.default({logger, repo, botManager}));
    for(let module of commandModules) {
      const keys = [module.key, ...module.aliases];
      for(let key of keys) {
        if(commands.hasOwnProperty(key)) {
          logger.warn(`Overwriting command ${key}`);
        } else {
          logger.info(`Setting command ${key}`);
        }
        commands[key] = module;
      }
    }
  });

  function initializePolling() {
    logger.info('Initializing polling...');
    glob.sync( path.join(__dirname.replace(/\\/g, '/'), './polls/*.{ts,js}') ).forEach(async (file: string) => {
      logger.info(`Loading polls from ${file}`);
      let pollModules: PollModule[] = await import(path.resolve(file)).then(p => p.default({logger, repo, botManager}));
      for(let poll of pollModules) {
        logger.info(`Initializing poll for ${poll.key}`);
        await poll.initialize();
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
    bot.on("command", async (commandContext: CommandContext) => {
      const { bot, ...loggableContext } = commandContext;
      logger.info(JSON.stringify(loggableContext));
      // This toLowerCase() can cause issues but makes commands more user-friendly.
      const keyword = commandContext.command.toLowerCase();
      if(commands.hasOwnProperty(keyword)) {
        // Record the command for stat tracking
        var commandEntry: CommandEntry = {
          _id: uuid(),
          timestamp: moment.utc().toDate(),
          command: commandContext.command,
          params: commandContext.params,
          userID: commandContext.userID,
          type: "command",
          botType: commandContext.bot.getBotType(),
          channelID: commandContext.channelID,
          serverID: commandContext.serverID,
          threadID: commandContext.threadID,
          messageID: commandContext.messageID
        };
        await repo.add("usage", commandEntry);

        try {
          // Then run the command
          await commands[keyword].execute(
            {
              keyword: keyword,
              params: commandContext.params, 
              bot: commandContext.bot, 
              userID: commandContext.userID, 
              channelID: commandContext.channelID, 
              threadID: commandContext.threadID,
              messageID: commandContext.messageID,
              serverID: commandContext.serverID, 
              respond: async (message: string | FormattedMessage[]): Promise<MessageConfirmation> => 
                        await bot.sendMessage(commandContext.channelID, message, commandContext.threadID)
            } as Command
          );
        } catch(commandError) {
          const errorMessage = `Error running command "${commandContext.command}": ${commandError.message}`;
          logger.error(errorMessage, loggableContext, commandError);
          await bot.sendMessage(commandContext.channelID, errorMessage, commandContext.threadID);
        }
      }
    })
  }

  // Start the health check server
  await health.startServer(logger, bots);
})();