import { Command, CommandModule, ServiceCollection } from "../Types";

import request from 'request';

export default (services: ServiceCollection): CommandModule[] => {  
  const modules: CommandModule[] = [
    {
      key: "inspire",
      aliases: [],
      execute: async (command: Command) => {
        request({
          url: "http://inspirobot.me/api?generate=true"
        }, async function(error, response, body) {
          if(error) {
            await command.respond(`An error occurred, sir.\n\n + ${error}`);
          } else {
            await command.respond(body);
          }
        });
      },
      help: {
        description: "Generates an inspirational quote and image using <http://inspirobot.me|inspirobot.me>",
        displayAsCommand: true,
        usage: ""
      }
    }
  ];

  return modules;
}