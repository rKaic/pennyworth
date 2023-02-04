import { randomElement } from "../core";
import { ServiceCollection, CommandModule, Command } from "../Types";

const maxPugsToBomb = 5;
const pugs = [
  "https://i.imgur.com/ZAg7AaU.jpg",
  "https://i.imgur.com/4cIl0R9.jpg",
  "https://i.imgur.com/hQ7y04r.jpg",
  "http://i.imgur.com/HZUxm.jpg",
  "http://i.imgur.com/Us9gGWv.png",
  "https://i.imgur.com/qySRqvi.jpg",
  "https://i.imgur.com/1UWvHzo.jpg",
  "https://i.imgur.com/C8VPyyG.jpg",
  "https://i.imgur.com/g0qYqwO.jpg",
  "https://i.imgur.com/ZBrkcdi.gif",
  "https://i.imgur.com/ZBrkcdi.gif",
  "https://i.imgur.com/ZBrkcdi.gif",
  "https://i.imgur.com/ZBrkcdi.gif",
  "https://i.imgur.com/ZBrkcdi.gif"
];
export default (services: ServiceCollection): CommandModule[] => {
  const modules: CommandModule[] = [
    {
      key: "pugbomb",
      aliases: [],
      execute: async (command: Command) => {
        for(let i = 0; i <= maxPugsToBomb; i++) {
          let randomPug = randomElement(pugs);
          await command.respond(randomPug);
        }
      },
      help: {
        description: "Floods the channel with random pictures of pugs.",
        displayAsCommand: true,
        usage: ``
      }
    }
  ];

  return modules;
};