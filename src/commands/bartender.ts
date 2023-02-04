import _ from 'lodash';
import { cocktailDb } from '../auth';
import { getJson, isNullOrEmpty, randomElement } from "../core";

import { Command, CommandModule, ServiceCollection } from '../Types';

export type CocktailInfo = {
  idDrink: string
  strDrink: string
  strDrinkThumb: string
}

export type Cocktail = CocktailInfo & {
  strCategory: string
  strAlcoholic: string
  strInstructions: string
  strDrinkAlternate?: string
  strTags?: string
  strVideo?: string
  strIBA?: string
  strGlass?: string
  strInstructionsES?: string
  strInstructionsDE?: string
  strInstructionsFR?: string
  strInstructionsIT?: string
  strIngredient1?: string
  strIngredient2?: string
  strIngredient3?: string
  strIngredient4?: string
  strIngredient5?: string
  strIngredient6?: string
  strIngredient7?: string
  strIngredient8?: string
  strIngredient9?: string
  strIngredient10?: string
  strIngredient11?: string
  strIngredient12?: string
  strIngredient13?: string
  strIngredient14?: string
  strIngredient15?: string
  strMeasure1?: string
  strMeasure2?: string
  strMeasure3?: string
  strMeasure4?: string
  strMeasure5?: string
  strMeasure6?: string
  strMeasure7?: string
  strMeasure8?: string
  strMeasure9?: string 
  strMeasure10?: string
  strMeasure11?: string
  strMeasure12?: string
  strMeasure13?: string
  strMeasure14?: string
  strMeasure15?: string
  strImageSource?: string
  strImageAttribution?: string
  strCreativeCommonsConfirmed?: string
  dateModified: string
};

type SearchResponse = {
  drinks?: Cocktail[]
}

type Ingredient = {
  idIngredient: string
  strIngredient: string
  strDescription: string
  strType: string
  strAlcohol: string
  strABV?: string
}

type FilterResponse = {
  drinks?: CocktailInfo[]
}

// services is an object containing `logger`, `repo`, and `botManager` fields
export default async (services: ServiceCollection): Promise<CommandModule[]> => {
  const apiKey = await cocktailDb.getApiKey();
  const baseUrl = `https://www.thecocktaildb.com/api/json/v1/${apiKey}`;

  const getDrinksByName = async (recipeName: string): Promise<Cocktail[]> => {
    const response: SearchResponse = await getJson(`${baseUrl}/search.php?s=${encodeURIComponent(recipeName)}`);
    return response?.drinks || [];
  };

  const getDrinkById = async (id): Promise<Cocktail | undefined> => {
    const response: SearchResponse = await getJson(`${baseUrl}/lookup.php?i=${id}`);
    return _.first(response?.drinks || []);
  };

  const getDrinksByIngredients = async (ingredients): Promise<Cocktail[]> => {
    const filterResponses: FilterResponse[] = await Promise.all(ingredients.map(i => getJson(`${baseUrl}/filter.php?i=${encodeURIComponent(i.trim())}`)));
    let drinksInCommon = _.intersectionBy(...filterResponses.map(r =>r.drinks || []), (drink) => {
      return (drink).idDrink;
    });
    const potentialDrinks = await Promise.all(drinksInCommon.map(d => getDrinkById(d.idDrink)));
    const drinks: Cocktail[] = [];
    for(let fullDrink of potentialDrinks) {
      if(fullDrink != null) {
        drinks.push(fullDrink)
      }
    }
    return drinks;
  };

  const formatDrink = (drink: Cocktail) => {
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
        
        let drinks: Cocktail[] = [];
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