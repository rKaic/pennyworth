# Pennyworth
Discord Bot and Butler Extraordinaire

## Running Pennyworth

```
node .\app.js
```

## Adding New Bot Types

* Add a new entry to `bots/botTypes.json` representing the new bot type.
* Add a new .js file under the `/bots` directory
  * The convention I've used is `<Type>Bot.js`, e.g. `DiscordBot.js`
  * This will contain your new bot that should extend the `Bot` class.
  * Your new Bot subclass must implement any functions from `Bot` such as `sendMessage`.

Example `ExampleBot.js`:
```
const botTypes = require('./botTypes.json');
const Bot = require('./Bot.js');
const ExampleClient = require('FakeExampleBotPackage');

module.exports = class ExampleBot extends Bot {
  constructor(logger, repo, token, signingSecret?) {
    let bot = new ExampleClient.Client({
      token: token
    });
    super(bot, botTypes.example, logger, repo);
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
          super.receivedMessage(userID, data.channelID, data.serverID, message);
         }
    });
  }

  async sendMessage(channelID, message) {
    await this.bot.sendMessage({
      to: channelID,
      message: message
    }, (error, response) => {
      if(error) {
        this.logger.error(error);
      }
    });
  }
};
```
* Add the appropriate token(s) as comma-delimited lists of environment variables, and add a method to `auth.js`
  * `PENNYWORTH_NEXTBOTAPP_TOKENS`
* In `app.js`, register your new bot in the botManager:
```
for(let exampleToken of auth.example.tokens) {
  botManager.addBot(new ExampleBot(logger, repo, exampleToken));
}
```

### Module Parameters

The `logger` parameter is a reference to the object responsible for logging debug and error information (this has been initialized in `app.js`)

The `repo` parameter is a reference to the object managing the persistent datastore implemented in `Repository.js`.

The `token` parameter is the service-and-user-specific application token that grants access to a defined Bot and Servers within Discord/Slack/etc.

## Adding Commands

Add a new .js file under the `/commands` directory. It will automatically be picked up when Pennyworth is run.

Example command module:

```
module.exports = (logger, repo, botManager) => {
  let module = {
    helloworld: (params, bot, userID, channelID, serverID, respond) => {
      respond("Hello, World");
    }
  };

  return module;
}
```

Example usage of the above module:
```
!helloworld
```

### Module Parameters

The `logger` parameter is a reference to the object responsible for logging debug and error information (this has been initialized in `app.js`)

The `repo` parameter is a reference to the object managing the persistent datastore implemented in `Repository.js`.

The `botManager` parameter is a reference to the object that provides access to the different `Bot`s that are currently running within Pennyworth.

### Command Parameters

The `params` parameter is an array of the text that was input after the command.
Ex: the user types `!helpme Obi-Wan Kenobi! You're my only hope!` which triggers the `!helpme` command, the `params` would be ```["Obi-Wan", "Kenobi!", "You're", "my", "only", "hope!"]```.

The `bot` parameter is a reference to the `Bot` that received the command.

The `userID` parameter is the service-specific ID of the user who invoked the command.

The `channelID` parameter is the service-specific ID of the channel in which the command was received.

The `serverID` parameter is the service-specific ID of the server/organization in which the command was received.

The `respond` parameter is a function that writes its argument to the channel in which the command was received.

## Adding Polls

Add a new .js file under the `/polls` directory. It will automatically be picked up when Pennyworth is run.

Example poll module:
```
function pollService() {
  // Do polling stuff here
}

module.exports = (bots, logger, repo, botManager) => {
  let module = {
    initialize: () => {
      pollService();
      setInterval(pollService, 60000);
    }
  };

  return module;
}
```

Polling will automatically be started via the initialize method once Pennyworth has successfully connected to all of its `Bot`s.

### Module Parameters

The `bots` parameter is an array of all active `Bot`s.

The `logger` parameter is a reference to the object responsible for logging debug and error information (this has been initialized in `app.js`)

The `repo` parameter is a reference to the object managing the persistent datastore implemented in `Repository.js`.

The `botManager` parameter is a reference to the object that provides access to the different `Bot`s that are currently running within Pennyworth.
