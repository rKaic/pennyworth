# Pennyworth
Slack & Discord Bot and Butler Extraordinaire

## Running Pennyworth

Pennyworth uses [yarn](https://yarnpkg.com/) as a package manager and app runner.
```shell
yarn install
```

Pennyworth's secrets are stored in [AWS Parameter Store](https://us-east-1.console.aws.amazon.com/systems-manager/parameters/?region=us-east-1&tab=Table#list_parameter_filters=Name:Contains:%2Fapplications%2Fpennyworth) under the namespace `/applications/pennyworth/`. Pennyworth can use your [AWS tokens from environment variables](https://docs.aws.amazon.com/singlesignon/latest/userguide/howtogetcredentials.html) to access Parameter Store.

To run Pennyworth with file-watching enabled:
```shell
yarn run dev
```

## Adding New Bot Types

* Add a new entry to `BotType` in `bots/Types.ts` representing the new bot type.
* Add a new .ts file under the `/bots` directory
  * The convention I've used is `<Type>Bot.ts`, e.g. `DiscordBot.ts`
  * This will contain your new bot that should extend the `Bot` class.
  * Your new Bot subclass must implement any functions from `Bot` such as `sendMessage`.

Example `ExampleBot.ts`:
```typescript
import { BotType, FormattedMessage, MessageConfirmation } from '../Types';
import Bot from './Bot';
import { Logger } from 'winston';
import Repository from '../Repository';
import ExampleClient from 'FakeExampleBotPackage';

class ExampleBot extends Bot {
  constructor(logger: Logger, repo: Repository, token: string, signingSecret?: string) {
    let bot = new ExampleClient.Client({
      token: token
    });
    super(bot, BotType.Example, logger, repo);
  }

  initialize() {
    super.initialize();

    this.bot.on('ready', () => {
      this.logger.info('Connected to Example');
      this.logger.info('Logged in as: ');
      this.logger.info(this.bot.username + ' - (' + this.bot.id + ')');
      super.initialized();
    });

    this.bot.on('message', (userID, data, message) => {
        if (this.isCommand(message)) {
          this.logger.info(`From Example: ${message}`);
          super.receivedMessage({userID, channelID: data.channelID, threadID: message.ts, serverID: data.serverID, message});
         }
    });
  }

  async sendMessage(channelID: string, message: string | FormattedMessage[], threadID?: string): Promise<MessageConfirmation> {
    return await this.bot.sendMessage({
      to: channelID,
      message: message
    }, (error, response) => {
      if(error) {
        this.logger.error(error);
      }
    });
  }
};

export default ExampleBot;
```
* Add the appropriate token(s) as comma-delimited lists of environment variables, and add a method to `auth.ts`
* In `app.ts`, register your new bot in the botManager:
```typescript
const exampleTokens = await auth.example.getTokens();
for(let exampleToken of exampleTokens) {
  botManager.addBot(new ExampleBot(logger, repo, exampleToken));
}
```

### Bot Parameters

The `logger` parameter is a reference to the object responsible for logging debug and error information (this has been initialized in `app.ts`)

The `repo` parameter is a reference to the object managing the persistent datastore implemented in `Repository.ts`.

The `token` parameter is the service-and-user-specific application token that grants access to a defined Bot and Servers within Discord/Slack/etc.

## Adding Commands

Add a new .ts file under the `/commands` directory. It will automatically be picked up when Pennyworth is run.

Example command module:

```typescript
import { Command, CommandModule, ServiceCollection } from '../Types';

// services is an object containing `logger`, `repo`, and `botManager` fields
export default (services: ServiceCollection): CommandModule[] => {
  const modules: CommandModule[] = [
    {
      key: "helloworld",
      aliases: ["hello"],
      // command is an object containing `keyword`, `params`, `bot`, `userID`, `channelID`, 'threadID', `serverID`, and `respond` 
      execute: async (command: Command) => {
        await command.respond(`Hello, ${command.params.length > 0 ? command.params[0] : "World"}!`);
      },
      help: {
        description: "Says hello to someone, or to the world if nobody has been specified.",
        displayAsCommand: true,
        usage: "[<name>]"
      }
    }
  ];

  return modules;
}
```

Example usages of the above module:
```javascript
!helloworld
// prints "Hello, World!"

!helloworld Batman 
// prints "Hello, Batman!"

!hello Robin
// prints "Hello, Robin!"
```

### Command and Poll Module Parameters

The `services` parameter contains references to other helpful top-level services:

#### The services Parameter

The `logger` field is a reference to the object responsible for logging debug and error information (this has been initialized in `app.ts`)

The `repo` field is a reference to the object managing the persistent datastore implemented in `Repository.ts`.

The `botManager` field is a reference to the object that provides access to the different `Bot`s that are currently running within Pennyworth.

### Command Parameters

The `commandArgs` parameter contains data useful to the fulfillment of commands:

#### The commandArgs Parameter

The `keyword` field is the toLowerCase() version of the command being run. Ex: the user types `!LEAVE ELVIS BUILDING`, the `keyword` would be `leave`. 

The `params` field is an array of the text that was input after the command.
Ex: the user types `!helpme Obi-Wan Kenobi! You're my only hope!` which triggers the `!helpme` command, the `params` would be ```["Obi-Wan", "Kenobi!", "You're", "my", "only", "hope!"]```.

The `bot` field is a reference to the `Bot` that received the command.

The `userID` field is the service-specific ID of the user who invoked the command.

The `channelID` field is the service-specific ID of the channel in which the command was received.

The `threadID` field is the service-specific ID of the thread in which the command was received.

The `serverID` field is the service-specific ID of the server/organization in which the command was received.

The `respond` field is a function that writes its argument to the channel in which the command was received.

## Adding Polls

Add a new .ts file under the `/polls` directory. It will automatically be picked up when Pennyworth is run.

Example poll module:
```typescript
import { PollModule, ServiceCollection } from '../Types';

export default (services: ServiceCollection): PollModule[] => {
  const pollService = async () => {
    // Do polling stuff here
  };

  const modules: PollModule[] = [{
    key: "Cool Demo Polling Service",
    initialize: async () => {
        await pollService();
        // Check once a minute
        setInterval(async () => await pollService(), 60000);
    }
  }];

  return modules;
};
```

Polling will automatically be started via the initialize method once Pennyworth has successfully connected to all of its `Bot`s.

### Module Parameters

The `services` parameter contains references to other helpful top-level services:

#### The services Parameter

The `logger` field is a reference to the object responsible for logging debug and error information (this has been initialized in `app.ts`)

The `repo` field is a reference to the object managing the persistent datastore implemented in `Repository.ts`.

The `botManager` field is a reference to the object that provides access to the different `Bot`s that are currently running within Pennyworth.

# Bumping Versions

Commits follow commit message conventions from the [github-tag action](https://github.com/marketplace/actions/github-tag#bumping)

The [semantic-pull-request action](https://github.com/marketplace/actions/semantic-pull-request) enforces that PR titles follow this message format.

## Commit Tags

| Tag | When to use |
| --- | --- |
|feat: | A new feature |
|fix: | A bug fix |
|docs: | Documentation only changes |
|style: | Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc) |
|refactor: | A code change that neither fixes a bug nor adds a feature |
|perf: | A code change that improves performance |
|test: | Adding missing or correcting existing tests |
|chore: | Changes to the build process or auxiliary tools and libraries such as documentation generation |