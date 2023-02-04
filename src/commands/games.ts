import { BattleshipGame } from "../lib/battleship";
import { Command, CommandModule, Game, GameState, ServiceCollection } from "../Types";

const collection = "games";

export default (services: ServiceCollection): CommandModule[] => {
    const getGameByName = (name: string, state: any): Game => {
        switch(name) {
            case "Battleship": return new BattleshipGame(services, state);
        }
        throw new Error(`Unrecognized game: ${name}`);
    }
    
    const modules: CommandModule[] = [
        {
            key: "battleship",
            aliases: [],
            execute: async (command: Command) => {
                const game = new BattleshipGame(services);
                await game.start(command);
                await services.repo.add(collection, game.getState());
            },
            help: {
                description: "Starts a game of Battleship against Pennyworth",
                displayAsCommand: true,
                usage: ""
            }
        }, {
            key: "updategamestate",
            aliases: [],
            execute: async (command: Command) => {
                const gameID = command.params[0];
                const gameAction = command.params[1];
                const actionParams = command.params.slice(2);
                const savedGameState: GameState = await services.repo.findById(collection, gameID);
                if(savedGameState) {
                    const game = getGameByName(savedGameState.name, savedGameState);
                    if(game) {
                        const updatedState = await game.updateState(gameAction, actionParams, command);
                        if(updatedState.isComplete) {
                            const deleted = await services.repo.removeById(collection, gameID);
                        } else {
                            await services.repo.update(collection, { _id: game._id }, updatedState);
                        }
                    } else {
                        await command.respond(`I didn't recognize a game of type ${savedGameState.name}`);
                    }
                }
            },
            help: {
                description: "Passes the selected action and its parameters to the selected game",
                displayAsCommand: false,
                usage: "<gameID> <action> [<action param 1> <action param 2>...]"
            }
        }, {
            key: "forfeitgame",
            aliases: [],
            execute: async (command: Command) => {
                const gameID = command.params[0];
                const gameState: GameState = await services.repo.findById(collection, gameID);
                if(!gameState) {
                    await command.respond(`I couldn't find a game with the ID ${gameID} to forfeit`);
                    return;
                }
    
                const game = getGameByName(gameState.name, gameState);
                await game.forfeit(command);
                const deleted = await services.repo.removeById(collection, gameID);
            },
            help: {
                description: "Forfeits the selected game",
                displayAsCommand: false,
                usage: "<gameID>"
            }
        }
    ];

    return modules;
}