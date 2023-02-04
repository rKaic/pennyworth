import _ from 'lodash';
import moment from 'moment';
import { Command, CommandEntry, CommandModule, ServiceCollection } from '../Types';

const commandEntryType = "command";

const collection = "usage";

type Query = {
  type: string,
  userID?: string,
  timestamp?: any
};

export default (services: ServiceCollection): CommandModule[] => {
  const usageError = (respond: (msg:string) => void) => {
    respond(`Usage: \`\`\`!stats <users|commands|mine> [today]\`\`\``);
  };

  const modules: CommandModule[] = [
    {
      key: "stats",
      aliases: [],
      execute: async (command: Command) => {
        if(command.params.length == 0) {
          usageError(command.respond);
          return;
        }
  
        let query: Query = { type: commandEntryType };
        let countByField = "command";
        switch(command.params[0].toLowerCase()) {
          case "users":
            countByField = "username";
            break;
          case "commands":
            countByField = "command";
            break;
          case "mine":
            query.userID = command.userID;
            break;
          default:
            usageError(command.respond);
            return;
        }
  
        if(command.params.length >= 2 && command.params[1].toLowerCase() === "today") {
          query.timestamp = { "$gte": moment.utc().format("YYYY-MM-DDT00:00:00") };
        }
  
        
        const docs: CommandEntry[] = await services.repo.find(collection, query);
  
        let commands = _.countBy(_.map(docs, (c) => {
          return {
            command: c.command, 
            id: c._id, 
            username: "Anonymous",
            timestamp: c.timestamp
          }; 
        }), countByField);
        let statsMessage = `\`\`\`${JSON.stringify(commands, _.orderBy(Object.keys(commands), (c) => {return commands[c]}, "desc"), 2)}\`\`\``;
        await command.respond(statsMessage);
      },
      help: {
        description: "Displays stats around Pennyworth's usage",
        displayAsCommand: true,
        usage: "<users|commands|mine> [today]"
      }
    }
  ];

  return modules;
}