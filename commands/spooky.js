module.exports = (logger, repo, botManager) => {
  function spooky(params, bot, userID, channelID, serverID, callback) {
    callback("https://i.imgur.com/lAmIlNP.gif");
  }

  let module = {
    "3spooky5me": spooky,
    spooky: spooky
  };

  return module;
}