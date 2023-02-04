import _ from 'lodash';
import { uuid } from '../core';
import { BotType, Command, CommandModule, ServiceCollection } from '../Types';

const collection = "requests";
const requestEntryType = "request";
const defectEntryType = "defect";
const validVerbs = ["new", "view", "edit", "delete"];

type EntryType = "request" | "defect";

type Query = {
  _id?: string,
  type: EntryType
}

type Request = {
  _id: string
  request: string
  userID: string
  type: "request"
  botType: BotType
};

type Defect = {
  _id: string
  defect: string
  userID: string
  type: "defect"
  botType: BotType
};

function buildQuery(entryType: EntryType, userID: string, entryId?: string): Query {
  let query = { type: entryType };

  if(entryId) {
    query["_id"] = entryId;
  }

  return query;
}


export default (services: ServiceCollection): CommandModule[] => {
  const modules: CommandModule[] = [
    {
      key: "requests",
      aliases: [],
      execute: async (command: Command) => {
        const docs: Request[] = await services.repo.find(collection, buildQuery(requestEntryType, command.userID));
        let usersRequests = _.map(docs, (r) => { 
          return {
            request: r.request, 
            id: r._id
          }; 
        });
        let requestsMessage = usersRequests.length > 0 ? `\`\`\`${JSON.stringify(usersRequests, null, 2)}\`\`\`` : "You have no open requests at this time.";
        await command.respond(requestsMessage);
      },
      help: {
        description: "Displays the list of open requests Pennyworth has",
        displayAsCommand: true,
        usage: ""
      }
    }, {
      key: "defects",
      aliases: [],
      execute: async (command: Command) => {
        const docs: Defect[] = await services.repo.find(collection, buildQuery(defectEntryType, command.userID));
        let usersDefects = _.map(docs, (r) => { 
          return {
            defect: r.defect, 
            id: r._id
          }; 
        });
        let defectsMessage = usersDefects.length > 0 ? `\`\`\`${JSON.stringify(usersDefects, null, 2)}\`\`\`` : "You have no open defects at this time.";
        await command.respond(defectsMessage);
      },
      help: {
        description: "Displays the list of open defect reports Pennyworth has",
        displayAsCommand: true,
        usage: ""
      }
    }, {
      key: "request",
      aliases: [],
      execute: async (command: Command) => {
        if(command.params.length < 2 || !_.includes(validVerbs, command.params[0])) {
          await command.respond(`Usage: \`\`\`!request <${validVerbs.join("|")}> <feature idea> \`\`\``);
          return;
        }
        
        switch(command.params[0].toLowerCase()) {
          case "new":
            // Record the request
            let requestEntry: Request = {
              _id: uuid(),
              request: command.params.slice(1).join(" "),
              userID: command.userID,
              type: requestEntryType,
              botType: command.bot.getBotType()
            };
            const addedEntry = await services.repo.add(collection, requestEntry);
            let requestCommands = [`!request view ${addedEntry?._id}`, `!request edit ${addedEntry?._id} <new description>`, `!request delete ${addedEntry?._id}`];
            await command.respond(`Thank you! I have recorded your feature request. You can view or modify it via \`\`\`${requestCommands.join("\n")}\`\`\``);
            break;
          case "view":
            let viewRequestId = command.params[1];
            const docs: any[] = await services.repo.find(collection, buildQuery(requestEntryType, command.userID, viewRequestId));
            if(docs && docs.length > 0) {
              await command.respond(`Your request: \`\`\`${_.first(docs).request}\`\`\``);
            }
            break;
          case "edit":
            let updateRequestId = command.params[1];
            let updatedRequestText = command.params.slice(2).join(" ");
            const updated = await services.repo.update(collection, buildQuery(requestEntryType, command.userID, updateRequestId), { request: updatedRequestText });
            await command.respond(`Updated request \`\`\`${updateRequestId}\`\`\` to \`\`\`${updatedRequestText}\`\`\``);
            break;
          case "delete":
            let deleteRequestId = command.params[1];
            const deleted = await services.repo.removeByQuery(collection, buildQuery(requestEntryType, command.userID, deleteRequestId));
            await command.respond(`Deleted request \`${deleteRequestId}\``);
            break;
          default:
            await command.respond(`${command.params[0]} hasn't been properly implemented like it should have been; go yell at your admin.`);
            return;
        }
      },
      help: {
        description: "Create, view, edit, or delete a feature request",
        displayAsCommand: true,
        usage: `<${validVerbs.join("|")}> <requestID (when not new)> <feature idea>`
      }
    }, {
      key: "defect",
      aliases: [],
      execute: async (command: Command) => {
        if(command.params.length < 2 || !_.includes(validVerbs, command.params[0])) {
          await command.respond(`Usage: \`\`\`!defect <${validVerbs.join("|")}> <description> \`\`\``);
          return;
        }
        
        switch(command.params[0].toLowerCase()) {
          case "new":
            // Record the defect
            let defectEntry: Defect = {
              _id: uuid(),
              defect: command.params.join(" "),
              userID: command.userID,
              type: defectEntryType,
              botType: command.bot.getBotType()
            };
            const newDefect = await services.repo.add(collection, defectEntry);
            if(newDefect) {
              let defectCommands = [`!defect view ${newDefect._id}`, `!defect edit ${newDefect._id} <new description>`, `!defect delete ${newDefect._id}`];
              await command.respond(`Thank you! I have recorded your defect report. You can view or modify it via \`\`\`${defectCommands.join("\n")}\`\`\``);
            }
            break;
          case "view":
            let viewDefectId = command.params[1];
            const docs: any[] = await services.repo.find(collection, buildQuery(defectEntryType, command.userID, viewDefectId));
            if(docs && docs.length > 1) {
              await command.respond(`Your request: \`\`\`${_.first(docs).request}\`\`\``);
            }
            break;
          case "edit":
            let updateDefectId = command.params[1];
            let updatedDefectText = command.params.slice(2).join(" ");
            const updated = await services.repo.update(collection, buildQuery(defectEntryType, command.userID, updateDefectId), { defect: updatedDefectText });
            await command.respond(`Updated defect \`\`\`${updateDefectId}\`\`\` to \`\`\`${updatedDefectText}\`\`\``);
            break;
          case "delete":
            let deleteDefectId = command.params[1];
            const deleted = await services.repo.removeByQuery(collection, buildQuery(defectEntryType, command.userID, deleteDefectId));
            await command.respond(`Cleared defect \`${deleteDefectId}\``);
            break;
          default:
            await command.respond(`${command.params[0]} hasn't been properly implemented like it should have been; go yell at your admin.`);
            return;
        }
      },
      help: {
        description: "Create, view, edit, or delete a defect report",
        displayAsCommand: true,
        usage: `<${validVerbs.join("|")}> <defect ID (when not new)> <description>`
      }
    }
  ];

  return modules;
}