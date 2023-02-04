import _ from 'lodash';
import { formatMessage, getVersion } from '../core';
import { Command, CommandModule, MessageFormat, ServiceCollection } from '../Types';

const GIT_REPO_URI = "https://github.com/eftours/air-slackbot";

export default (services: ServiceCollection): CommandModule[] => {
  const modules: CommandModule[] = [
    {
      key: "greet",
      aliases: [],
      execute: async (command: Command) => {
        await command.respond(`Welcome to the Batcave`);
      },
      help: {
        description: "Welcomes the user to the Batcave. A glorified ping.",
        displayAsCommand: false,
        usage: ``
      }
    },
    {
      key: "ping",
      aliases: [],
      execute: async (command: Command) => {
        await command.respond("pong");
      },
      help: {
        description: "Sends a ping to Pennyworth, expecting him to reply with a `pong`",
        displayAsCommand: true,
        usage: ``
      }
    },
    {
      key: "die",
      aliases: [],
      execute: async (command: Command) => {
        await command.respond("Shutting down...");
        process.exit();
      },
      help: {
        description: "Tells Pennyworth to kill his current process.\n\nUse if Pennyworth got himself somehow stuck doing something you really don't want.",
        displayAsCommand: true,
        usage: ``
      }
    },
    {
      key: "about",
      aliases: [],
      execute: async (command: Command) => {
        await command.respond([
          formatMessage(MessageFormat.Header, "About Myself"), 
          formatMessage(MessageFormat.Markdown, `Greetings! My name is ${command.bot.getName()}.`),
          formatMessage(MessageFormat.Markdown, `I am a Slack Bot run by the Air Team here at EF.`),
          formatMessage(MessageFormat.Markdown, `You can find my source code on <${GIT_REPO_URI}|GitHub>.`),
          formatMessage(MessageFormat.Markdown, `I will respond to a user typing \`!help\` with a list of my available commands.`)
        ]);
      },
      help: {
        description: "Pennyworth describes himself",
        displayAsCommand: true,
        usage: ``
      }
    },
    {
      key: "faq",
      aliases: [],
      execute: async (command: Command) => {
        await command.respond([
          formatMessage(MessageFormat.Header, "Frequently Asked Questions"),
          formatMessage(MessageFormat.Markdown, `*What can you do?*\nI can help with creating release docs, promoting deployments of Air services, and provide helpful links.\n\nType \`${command.bot.commandParam}help\` to get a full list of my commands, or view my Slack profile for slash (\`/\`) commands.`),
          formatMessage(MessageFormat.Divider),
          formatMessage(MessageFormat.Markdown, `*I want to change or add functionality to Pennyworth. Can I?*\nSure can! Pennyworth is written in TypeScript; open a PR <${GIT_REPO_URI}|on GitHub!>`),
          formatMessage(MessageFormat.Divider),
          formatMessage(MessageFormat.Markdown, `*Are you a clown?*\nNo. I am a butler, not a clown. You must be confusing me with Pennywise.`),
          formatMessage(MessageFormat.Divider)
        ]);
      },
      help: {
        description: "Frequently Asked Questions about Pennyworth and their answers",
        displayAsCommand: true,
        usage: ""
      }
    },
    {
      key: "version",
      aliases: [],
      execute: async (command: Command) => {
        await command.respond([
          formatMessage(MessageFormat.Header, "Version"),
          formatMessage(MessageFormat.Markdown, getVersion())
        ]);
      },
      help: {
        description: "Prints the current version of Pennyworth",
        displayAsCommand: true,
        usage: ""
      }
    }
  ];

  return modules;
}