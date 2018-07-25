# Pennyworth
Discord Bot and Butler Extraordinaire

## Running Pennyworth

```
node .\app.js
```

## Adding Commands

Add a new .js file under the /commands directory. It will automatically be picked up when Pennyworth is run.

Example command module:

```
module.exports = (logger, repo, botManager) => {
  let module = {
    helloworld: (params, bot, userID, channelID, serverID, callback) => {
      callback("Hello, World");
    }
  };

  return module;
}
```

Example usage of the above module:
```
!helloworld
```

## Adding Polls

Add a new .js file under the /polls directory. It will automatically be picked up when Pennyworth is run.

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

Polling will automatically be started via the initialize method once Pennyworth has successfully connected to Discord.
