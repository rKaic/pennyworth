import _ from 'lodash';
import { cocktailDb } from '../auth';
import { getJson, isNullOrEmpty, randomElement } from "../core";

import { Command, CommandModule, ServiceCollection } from '../Types';

// services is an object containing `logger`, `repo`, and `botManager` fields
export default async (services: ServiceCollection): Promise<CommandModule[]> => {
  const apiKey = await cocktailDb.getApiKey();
  const baseUrl = `https://www.thecocktaildb.com/api/json/v1/${apiKey}`;

  const getDrinksByName = async (recipeName: string): Promise<any[]> => {
    const drinks: any[] = await getJson(`${baseUrl}/search.php?s=${encodeURIComponent(recipeName)}`);
    return drinks || [];
  };

  const getDrinkById = async (id): Promise<any | undefined> => {
    const drinks: any[] = await getJson(`${baseUrl}/lookup.php?i=${id}`);
    return _.first(drinks);
  };

  const getDrinksByIngredients = async (ingredients): Promise<any[]> => {
    const drinks = await Promise.all(ingredients.map(i => getJson(`${baseUrl}/filter.php?i=${encodeURIComponent(i.trim())}`)));
    let drinksInCommon = _.intersectionBy(...drinks, (drink) => {
      return (drink).idDrink;
    });
    return await Promise.all(drinksInCommon.map(d => getDrinkById(d.idDrink)));
  };

  const formatDrink = (drink) => {
    let ingredients: string[] = [];
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

  const modules: CommandModule[] = [
    {
      key: "bartender",
      aliases: [],
      execute: async (command: Command) => {
        if(command.params.length === 0) {
          await command.respond("Usage: \`\`\`!bartender name <search term>\`\`\` \`\`\`!bartender ingredients <ingredient>[, ingredient, ingredient]\`\`\`");
          return;
        }
        
        let drinks: any[] = [];
        switch(command.params[0].toLowerCase()) {
          case "name":
            drinks = await getDrinksByName(command.params.slice(1).join(" "));
            break;
          case "ingredients":
            let ingredients = command.params.slice(1).join(" ").split(",");
            drinks = await getDrinksByIngredients(ingredients);
            break;
          default:
            break;
        }

        if(drinks.length > 0) {
          let randomDrink = randomElement(drinks);
          await command.respond(formatDrink(randomDrink));
        }
      },
      help: {
        description: "Returns a random cocktail, searchable by name or ingredient",
        displayAsCommand: true,
        usage: "`name <search term>` or `ingredients <ingredient>[, ingredient, ingredient]`"
      }
    }
  ];

  return modules;
}