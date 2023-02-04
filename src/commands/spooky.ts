import { Command, CommandModule, ServiceCollection } from '../Types';

// services is an object containing `logger`, `repo`, and `botManager` fields
export default (services: ServiceCollection): CommandModule[] => {
  const modules: CommandModule[] = [
    {
      key: "spooky",
      aliases: ["3spooky5me"],
      execute: async (command: Command) => {
        await command.respond("https://i.imgur.com/lAmIlNP.gif");
      },
      help: {
        description: "Expresses how spooky something was.",
        displayAsCommand: true,
        usage: ""
      }
    }
  ];

  return modules;
}