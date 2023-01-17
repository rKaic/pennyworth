const request = require('request-promise-native');
const _ = require('lodash');
const auth = require('../auth.js');
const core = require("../core.js");

const baseUrl = `https://www.thecocktaildb.com/api/json/v1/${auth.cocktailDb.getApiKey()}`;

module.exports = (logger, repo, botManager) => {
  const isNullOrEmpty = (value) => {
    return typeof value === "undefined" || value === null || (typeof value.trim === "function" && value.trim() === "");
  }

  const getDrinksByName = (recipeName, callback) => {
    request({
      url: `${baseUrl}/search.php?s=${encodeURIComponent(recipeName)}`,
      headers: {
        accept: "application/json"
      }
    }, (error, response, body) => {
      if(error) {
        logger.error(error);
        callback("Failed to get drinks. Please check my error log.");
      }

      let drinks = JSON.parse(body).drinks;
      if(!drinks) {
        callback("I'm sorry, I was unable to find any drinks matching that search term.");
      } else {
        callback(null, drinks);
      }
    });
  };

  const getDrinkById = (id, callback) => {
    request({
      url: `${baseUrl}/lookup.php?i=${id}`,
      headers: {
        accept: "application/json"
      }
    }, (error, response, body) => {
      if(error) {
        logger.error(error);
        callback("Failed to get drinks. Please check my error log.");
      }

      let drinks = JSON.parse(body).drinks;
      if(!drinks) {
        callback("I'm sorry, I was unable to find any drink matching with that ID.");
      } else {
        callback(null, _.first(drinks));
      }
    });
  };

  const getDrinksByIngredients = (ingredients, callback) => {
    let promises = _.map(ingredients, (ingredient) => {
      return request({
        url: `${baseUrl}/filter.php?i=${encodeURIComponent(ingredient.trim())}`,
        headers: {
          accept: "application/json"
        }
      }).promise();
    });
    Promise.all(promises).then((results) => {
      let parsedDrinks = _.map(results, (result) => {
        return JSON.parse(result).drinks;
      });
      let drinksInCommon = _.intersectionBy(...parsedDrinks, (drink) => {
        return (drink).idDrink;
      });
      let randomDrink = core.random(drinksInCommon);
      getDrinkById(randomDrink.idDrink, (err, drink) => {
        callback(err, drink);
      });
    }).catch((err) => {
      logger.error(err);
      callback(err);
    });
  };

  const formatDrink = (drink) => {
    let ingredients = [];
    for(let i = 1; i < 16; i++) {
      let ingredient = drink[`strIngredient${i}`];
      let unitOfMeasure = drink[`strMeasure${i}`];
      if(isNullOrEmpty(ingredient) && isNullOrEmpty(unitOfMeasure)) {
        break;
      }
      ingredients.push(`${unitOfMeasure.trim()} ${ingredient}`);
    }
    return [
      drink.strDrinkThumb,
      `**Name: ** ${drink.strDrink}`,
      `**Ingredients: ** \n\t\t* ${ingredients.join("\n\t\t* ")}`,
      "**Instructions: **",
      `\t${drink.strInstructions}`
    ].join("\n\t");
  };

  let module = {
    bartender: (params, bot, userID, channelID, serverID, callback) => {
      if(params.length === 0) {
        callback("Usage: \`\`\`!bartender name <search term>\`\`\` \`\`\`!bartender ingredients <ingredient>[, ingredient, ingredient]\`\`\`");
        return;
      }

      switch(params[0].toLowerCase()) {
        case "name":
          getDrinksByName(params.slice(1).join(" "), (err, drinks) => {
            if(err) {
              callback(err);
              return;
            }
    
            let randomDrink = core.random(drinks);
            callback(formatDrink(randomDrink));
          });
          break;
        case "ingredients":
          let ingredients = params.slice(1).join(" ").split(",");
          getDrinksByIngredients(ingredients, (err, drinks) => {
            if(err) {
              callback(err);
              return;
            }

            callback(formatDrink(drinks));
          });
          break;
        default:
          break;
      }
    }
  };

  return module;
}