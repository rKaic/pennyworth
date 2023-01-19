const moment = require('moment');
const _ = require('lodash');

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
  },
  nextX: {
    regex: /^next (\w+)( at ([\w:]+))? (.*)/i,
    hour: 13,
    minute: 0
  },
  xTime: {
    regex: /^(.+) (Minute|Minutes|Hour|Hours|Day|Days|Week|Weeks|Month|Months) (.+)/i
  }
};

// Based on https://www.reddit.com/r/RemindMeBot/comments/2862bd/remindmebot_date_options/
function toReminder(msg) {
  let targetTime = moment.utc();
  let text = msg;
  let matches = [];
  // https://stackoverflow.com/a/2896642/1451556
  switch(true) {
    case times.endOfDay.regex.test(msg):
      matches = times.endOfDay.regex.exec(msg);
      text = matches[1];
      targetTime.hour(times.endOfDay.hour);
      targetTime.minute(times.endOfDay.minute);
      break;
    case times.endOfWeek.regex.test(msg):
      matches = times.endOfWeek.regex.exec(msg);
      text = matches[1];
      targetTime.day(times.endOfWeek.day);
      targetTime.hour(times.endOfWeek.hour);
      targetTime.minute(times.endOfWeek.minute);
      break;
    case times.endOfMonth.regex.test(msg):
      matches = times.endOfMonth.regex.exec(msg);
      text = matches[1];
      targetTime.endOf("month");
      targetTime.hour(times.endOfMonth.hour);
      targetTime.minute(times.endOfMonth.minute);
      break;
    case times.tomorrow.regex.test(msg):
      matches = times.tomorrow.regex.exec(msg);
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
      matches = times.tonight.regex.exec(msg);
      text = matches[1];
      targetTime.hour(times.tonight.hour);
      targetTime.minute(times.tonight.minute);
      break;
    case times.nextX.regex.test(msg):
      matches = times.nextX.regex.exec(msg);
      text = _.last(matches);
      targetTime.add(1, matches[1]);
      if(typeof matches[3] !== "undefined") {
        let next = moment.utc(matches[3], "hh:mm a");
        targetTime.hour(next.hour());
        targetTime.minute(next.minute());
      } else {
        targetTime.hour(times.nextX.hour);
        targetTime.minute(times.nextX.minute);
      }
      break;
    case times.xTime.regex.test(msg):
      matches = times.xTime.regex.exec(msg);
      text = matches[3];
      let numTime = matches[1];
      targetTime.add(numTime, matches[2]);
      break;
    default:
      // Default to tomorrow
      targetTime.add(1, "days");
      targetTime.hour(times.tomorrow.hour);
      targetTime.minute(times.tomorrow.minute);
      break;
  }

  return {
    time: targetTime.format(),
    timeText: targetTime.format("dddd, MMMM Do YYYY [at] h:mm a UTC"),
    text: text.replace(/^to /i, "")
  }
}

module.exports = (logger, repo, botManager) => {
  const reminderType = "reminder";
  let poll = null;
  
  function pollReminders() {
    let now = moment.utc();
    let remindersToRemove = [];
    repo.findAllByType(reminderType, async (error, reminders) => {
      for(let reminder of reminders) {
        if(now.isSameOrAfter(moment.utc(reminder.time), "minute")) {
          let bot = botManager.getBot(reminder.botType);
          await bot.sendMessageToUser(reminder.userID, `Reminder: ${reminder.text}`);
          remindersToRemove.push(reminder._id);
        }
      }
    
      if(reminders.length <= remindersToRemove.length) {
        clearInterval(poll);
        poll = null;
      }
    
      if(remindersToRemove.length > 0) {
        for(let r of remindersToRemove) {
          repo.removeById(r);
        }
      }
    });
  }

  let module = {
    remindme: (params, bot, userID, channelID, serverID, respond) => {
      if(params.length < 1) {
        respond("Usage: \`\`\`!remindme <time> <message>\`\`\`");
        return;
      }

      let reminder = toReminder(params.join(" "));
      reminder.userID = userID;
      reminder.type = reminderType;
      reminder.botType = bot.getBotType();
      repo.add(reminder, (err, r) => {
        if(err) {
          respond("I'm sorry, but there was an error when setting that reminder. Please check my error logs.");
          return;
        }
        respond(`I will remind you on ${reminder.timeText} to ${reminder.text}. \nYou can remove this reminder with \`!remembered ${r._id}\``);

        if(!poll) {
          poll = setInterval(pollReminders, 60000);
        }
      });
    },
    remembered: (params, bot, userID, channelID, serverID, respond) => {
      if(params.length === 0) {
        respond("Usage: \`\`\`!remembered <id>\`\`\`");
        return;
      }

      let reminderId = params[0];
      repo.removeById(reminderId, (err, numRemoved) => {
        if(err) {
          respond("I'm sorry, but there was an error when removing that reminder. Please check my error logs.");
          return;
        }
        
        respond(`Cleared reminder \`${reminderId}\``);
      });
    },
    clearreminders: (params, bot, userID, channelID, serverID, respond) => {
      repo.removeByUserID(userID, async (err, numRemoved) => {
        if(err) {
          respond("I'm sorry, but there was an error when removing your reminders. Please check my error logs.");
          return;
        }

        await bot.sendMessageToUser(userID, `I've cleared your ${numRemoved} reminders`);
      });
    },
    reminders: (params, bot, userID, channelID, serverID, respond) => {
      repo.find({ type: reminderType, userID: userID }, async (err, docs) => {
        if(err) {
          respond("I'm sorry, but there was an error when retrieving your reminders. Please check my error logs.");
          return;
        }

        let usersReminders = _.map(docs, (r) => { 
          return {
            text: r.text, 
            id: r._id, 
            time: r.timeText
          }; 
        });
        let remindersMessage = usersReminders.length > 0 ? `\`\`\`${JSON.stringify(usersReminders, null, 2)}\`\`\`` : "You have no reminders at this time.";
        await bot.sendMessageToUser(userID, remindersMessage);
        respond(`I've messaged you with your current reminders.`);
      });
    }
  };

  if(!poll) {
    pollReminders();
    poll = setInterval(pollReminders, 60000);
  }

  return module;
}