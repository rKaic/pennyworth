import { randomElement } from '../core';
import { Command, CommandModule, ServiceCollection } from '../Types';

const thunks = [
  "https://i.imgur.com/uq7lIwd.gif",
  "https://i.imgur.com/eCJVS64.gif",
  "https://i.imgur.com/fkN1EWj.gifv",
  "https://i.imgur.com/91VpvOy.gif"
];

// services is an object containing `logger`, `repo`, and `botManager` fields
export default (services: ServiceCollection): CommandModule[] => {
  const modules: CommandModule[] = [
    {
      key: "thinking",
      aliases: [],
      // command is an object containing `keyword`, `params`, `bot`, `userID`, `channelID`, 'threadID', `serverID`, and `respond` 
      execute: async (command: Command) => {
        let randomImage = randomElement(thunks);
        await command.respond(randomImage);
      },
      help: {
        description: "Displays a random image of pondering.",
        displayAsCommand: true,
        usage: ""
      }
    }
  ];

  return modules;
}