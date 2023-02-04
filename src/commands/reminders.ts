import { BotType, Command, CommandModule, ServiceCollection } from "../Types";
import moment, { Moment } from 'moment';
import _ from 'lodash';
import { uuid } from "../core";

const collection = "reminders";

type Reminder = {
  _id: string,
  time: string,
  timeText: string,
  text?: string,
  userID: string,
  type: string,
  botType: BotType
};

const times = {
  endOfDay: {
    regex: /^eod (.+)/i,
    hour: 21,
    minute: 0
  },
  endOfWeek: {
    regex: /^eow (.+)/i,
    day: "Friday",
    hour: 13,
    minute: 0
  },
  endOfMonth: {
    regex: /^eom (.+)/i,
    hour: 13,
    minute: 0
  },
  tomorrow: {
    regex: /^tomorrow( at ([\w:]+))? (.*)/i,
    hour: 13,
    minute: 0
  },
  tonight: {
    regex: /^tonight (.*)/i,
    hour: 22,
    minute: 0
  }
};

// Based on https://www.reddit.com/r/RemindMeBot/comments/2862bd/remindmebot_date_options/
function toReminder(msg: string, userID: string, reminderType: string, botType: BotType): Reminder {
  let targetTime: Moment = moment.utc();
  let text: string | undefined = msg;
  let matches: string[] = [];
  // https://stackoverflow.com/a/2896642/1451556
  switch(true) {
    case times.endOfDay.regex.test(msg):
      matches = times.endOfDay.regex.exec(msg) || [];
      text = matches[1];
      targetTime.hour(times.endOfDay.hour);
      targetTime.minute(times.endOfDay.minute);
      break;
    case times.endOfWeek.regex.test(msg):
      matches = times.endOfWeek.regex.exec(msg) || [];
      text = matches[1];
      targetTime.day(times.endOfWeek.day);
      targetTime.hour(times.endOfWeek.hour);
      targetTime.minute(times.endOfWeek.minute);
      break;
    case times.endOfMonth.regex.test(msg):
      matches = times.endOfMonth.regex.exec(msg) || [];
      text = matches[1];
      targetTime.endOf("month");
      targetTime.hour(times.endOfMonth.hour);
      targetTime.minute(times.endOfMonth.minute);
      break;
    case times.tomorrow.regex.test(msg):
      matches = times.tomorrow.regex.exec(msg) || [];
      text = _.last(matches);
      targetTime.add(1, "days");
      if(typeof matches[2] !== "undefined") {
        let next = moment.utc(matches[2], "hh:mm a");
        targetTime.hour(next.hour());
        targetTime.minute(next.minute());
      } else {
        targetTime.hour(times.tomorrow.hour);
        targetTime.minute(times.tomorrow.minute);
      }
      break;
    case times.tonight.regex.test(msg):
      matches = times.tonight.regex.exec(msg) || [];
      text = matches[1];
      targetTime.hour(times.tonight.hour);
      targetTime.minute(times.tonight.minute);
      break;
    default:
      // Default to tomorrow
      targetTime.add(1, "days");
      targetTime.hour(times.tomorrow.hour);
      targetTime.minute(times.tomorrow.minute);
      break;
  }

  return {
    _id: uuid(),
    time: targetTime.format(),
    timeText: targetTime.format("dddd, MMMM Do YYYY [at] h:mm a UTC"),
    text: text?.replace(/^to /i, ""),
    userID,
    type: reminderType,
    botType
  }
}

export default async (services: ServiceCollection): Promise<CommandModule[]> => {
  const reminderType = "reminder";
  let poll: NodeJS.Timer | null = null;
  
  const pollReminders = async () => {
    let now = moment.utc();
    let remindersToRemove: any[] = [];
    const reminders: Reminder[] = await services.repo.findAllByType(collection, reminderType);
    for(let reminder of reminders) {
      if(now.isSameOrAfter(moment.utc(reminder.time), "minute")) {
        let bot = services.botManager.getBot(reminder.botType);
        if(bot) {
          await bot.sendMessageToUser(reminder.userID, `Reminder: ${reminder.text}`);
          remindersToRemove.push(reminder._id);
        }
      }
    }
  
    if(reminders.length <= remindersToRemove.length) {
      if(poll) {
        clearInterval(poll);
      }
      poll = null;
    }
  
    if(remindersToRemove.length > 0) {
      await Promise.all(remindersToRemove.map(r => services.repo.removeById(collection, r)));
    }
  }

  if(!poll) {
    await pollReminders();
    poll = setInterval(async () => await pollReminders, 60000);
  }

  const modules: CommandModule[] = [
    {
      key: "remindme",
      aliases: [],
      execute: async (command: Command) => {
        if(command.params.length < 1) {
          await command.respond("Usage: \`\`\`!remindme <time> <message>\`\`\`");
          return;
        }
  
        let reminder = toReminder(command.params.join(" "), command.userID, reminderType, command.bot.getBotType());
        reminder.userID = command.userID;
        reminder.type = reminderType;
        reminder.botType = command.bot.getBotType();
        const addedReminder = await services.repo.add(collection, reminder);
        if(addedReminder) {
          await command.respond(`I will remind you on ${reminder.timeText} to ${reminder.text}. \nYou can remove this reminder with \`!remembered ${addedReminder._id}\``);
        }
  
        if(!poll) {
          poll = setInterval(async () => {await pollReminders();}, 60000);
        }
      },
      help: {
        description: "Sets a reminder that Pennyworth will track for you and message you about it at a later time",
        displayAsCommand: true,
        usage: "<time> <message>"
      }
    }, {
      key: "remembered",
      aliases: [],
      execute: async (command: Command) => {
        if(command.params.length === 0) {
          await command.respond("Usage: \`\`\`!remembered <id>\`\`\`");
          return;
        }
  
        let reminderId = command.params[0];
        const numRemoved = await services.repo.removeById(collection, reminderId);
          
        await command.respond(`Cleared reminder \`${reminderId}\``);
      },
      help: {
        description: "Clears the selected reminder",
        displayAsCommand: true,
        usage: "<reminder ID>"
      }
    }, {
      key: "clearreminders",
      aliases: [],
      execute: async (command: Command) => {
        const numRemoved = await services.repo.removeByUserID(collection, command.userID);
        await command.bot.sendMessageToUser(command.userID, `I've cleared your ${numRemoved} reminders`);
      },
      help: {
        description: "Clears all of the user's reminders",
        displayAsCommand: true,
        usage: ""
      }
    }, {
      key: "reminders",
      aliases: [],
      execute: async (command: Command) => {
        const docs = await services.repo.find<Reminder>(collection, { type: reminderType, userID: command.userID });
        let usersReminders = _.map(docs, (r) => { 
          return {
            text: r.text, 
            id: r._id, 
            time: r.timeText
          }; 
        });
        let remindersMessage = usersReminders.length > 0 ? `\`\`\`${JSON.stringify(usersReminders, null, 2)}\`\`\`` : "You have no reminders at this time.";
        await command.bot.sendMessageToUser(command.userID, remindersMessage);
        await command.respond(`I've messaged you with your current reminders.`);
      },
      help: {
        description: "Displays a list of all of the user's reminders",
        displayAsCommand: true,
        usage: ""
      }
    }
  ];

  return modules;
}