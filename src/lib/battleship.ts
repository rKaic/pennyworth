import { chunk, distinct, formatMessage, randomElement, randomInt, uuid } from "../core";
import { ButtonFormat, Command, FormattedMessage, Game, GameState, MessageConfirmation, MessageFormat, ServiceCollection } from "../Types";

const collection = "games";
const STARTING_CHAR_CODE = 'A'.charCodeAt(0);
const BATTLESHIP_GRID_SIZE = 7;
const ICONS = {
    EmptySpace: "🌊",
    Hit: "🔥",
    Miss: "🚫",
    Carrier: "🛫",
    Battleship: "🚢",
    Cruiser: "🔩",
    Submarine: "⚓",
    Destroyer: "🚤"
};

type GameSquare = {
    position: Position
    ships: {
        [faction: string]: Ship
    }
    attackedBy: Faction[]
};

type GameBoard = {
    squares: GameSquare[]
    gridSize: number
};

type BattleshipGameState = GameState & {
    board: GameBoard
};

type BoardDisplayOptions = {
    displayShips: boolean,
    faction: Faction
};

type GameDisplayOptions = {
    endOfGame: boolean
    displayShipPlacementControls: boolean
    placementControls?: {
        shipType: ShipType
        initialPositions: Position[]
        endPositions?: Position[]
    }
    displayTargetingBoard: boolean
    displayFireControls: boolean
};

enum ShipType {
    Carrier,
    Battleship,
    Cruiser,
    Submarine,
    Destroyer
};

type Faction = "Player" | "Bot";

type Winner = Faction | "Tie";

type Position = {
    letter: string
    number: number
    index: number
}

type Ship = {
    type: ShipType
    faction: Faction
    initialPosition?: Position
    segments: Position[]
};

const getOpposition = (faction: Faction): Faction => {
    switch(faction) {
        case "Player": return "Bot";
        case "Bot": return "Player";
    };
}

const getIcon = (square: GameSquare, options: BoardDisplayOptions): string => {
    const opposition = getOpposition(options.faction);
    if(square.attackedBy.includes(opposition)) {
        return square.ships.hasOwnProperty(options.faction) ? ICONS.Hit : ICONS.Miss;
    }
    if(options.displayShips) {
        if(square.ships.hasOwnProperty(options.faction)) {
            return ICONS[ShipType[square.ships[options.faction].type]];
        }
    }
    return ICONS.EmptySpace;
};

const getLengthOfShipByType = (type: ShipType): number => {
    switch(type) {
        case ShipType.Carrier: return 5;
        case ShipType.Battleship: return 4;
        case ShipType.Cruiser: return 3;
        case ShipType.Submarine: return 3;
        case ShipType.Destroyer: return 2;
    }
};

const addShipToBoard = (board: GameBoard, ship: Ship, from: Position, to: Position): GameBoard => {
    const shipPositions = getPositionsBetween(board, from, to);
    ship.segments = shipPositions;
    if(ship.segments.length !== getLengthOfShipByType(ship.type)) {
        throw new Error(`Invalid ship placement. Expected a ${ShipType[ship.type]} to be ${getLengthOfShipByType(ship.type)} but instead was ${ship.segments.length}`);
    }
    for(let position of shipPositions) {
        board.squares[position.index].ships[ship.faction] = ship;
    }
    return board;
};

const generateBotShipsOntoBoard = (board: GameBoard): GameBoard => {
    // Get initial available position
    // Determine available end positions based on length

    const ships: Ship[] = [{
        faction: "Bot",
        type: ShipType.Carrier,
        segments: []
    },{
        faction: "Bot",
        type: ShipType.Battleship,
        segments: []
    },{
        faction: "Bot",
        type: ShipType.Cruiser,
        segments: []
    },{
        faction: "Bot",
        type: ShipType.Submarine,
        segments: []
    },{
        faction: "Bot",
        type: ShipType.Destroyer,
        segments: []
    }];

    for(let ship of ships) {
        const availablePositions = getValidPlacementPositions(board, ship.faction, ship.type);
        if(availablePositions.length === 0) {
            throw new Error(`No valid placements for ${ShipType[ship.type]}`)
        }
        const selectedInitialPosition = randomElement(availablePositions);
        const endPositions = getValidEndPositions(board, ship.faction, selectedInitialPosition, ship.type);
        const selectedEndPosition = randomElement(endPositions);
        const shipPositions = getPositionsBetween(board, selectedInitialPosition, selectedEndPosition);
        ship.segments = shipPositions;
        if(ship.segments.length !== getLengthOfShipByType(ship.type)) {
            throw new Error(`Invalid ship placement. Expected a ${ShipType[ship.type]} to be ${getLengthOfShipByType(ship.type)} but instead was ${ship.segments.length}`);
        }
        for(let position of shipPositions) {
            board.squares[position.index].ships[ship.faction] = ship;
        }
    }

    return board;
};

const generateBoard = (): GameBoard => {
    const emptySquares = new Array(BATTLESHIP_GRID_SIZE * BATTLESHIP_GRID_SIZE);
    emptySquares.fill(ICONS.EmptySpace);
    const board = {
        squares: emptySquares.map((empty: string, i: number) => ({
            position: getPositionForIndex(BATTLESHIP_GRID_SIZE, i),
            ships: {},
            attackedBy: []
        } as GameSquare)),
        gridSize: BATTLESHIP_GRID_SIZE
    };
    
    return generateBotShipsOntoBoard(board);
};

const formatBoard = (board: GameBoard, options: BoardDisplayOptions): FormattedMessage => {
    const displayRows = chunk(board.squares.map(sq => getIcon(sq, options)), BATTLESHIP_GRID_SIZE);
    const printableRows = [[" ", ...getLettersForBoard(board)].join(" |  ")];
    for(let i = 0; i < displayRows.length; i++) {
        printableRows.push(`${i+1} | ${displayRows[i].join(" | ")}`);
    }
    return formatMessage(MessageFormat.Markdown, `\`\`\`\n${printableRows.join("\n")}\n\`\`\``);
};

const getLettersForBoard = (board: GameBoard): string[] => {
    const letters: string[] = [];
    for(let c = STARTING_CHAR_CODE; c < STARTING_CHAR_CODE + board.gridSize; c++) {
        letters.push(String.fromCharCode(c));
    }
    return letters;
};

const getNumbersForBoard = (board: GameBoard): number[] => [...Array(board.gridSize).keys()].map(n => n+1);

const getFireControls = (gameID: string, board: GameBoard): FormattedMessage => {
    const unfiredAtPositions = board.squares.filter(sq => !sq.attackedBy.includes("Player")).map(sq => sq.position);
    const unfiredAtLetters = distinct(unfiredAtPositions.map(p => p.letter));
    unfiredAtLetters.sort();
    const unfiredAtNumbers = distinct(unfiredAtPositions.map(p => p.number));
    unfiredAtNumbers.sort();
    return formatMessage(MessageFormat.Actions, '', [
        formatMessage(MessageFormat.Dropdown, "Letter", { actionId: 'action_select_letter', options: unfiredAtLetters}),
        formatMessage(MessageFormat.Dropdown, "Number", { actionId: 'action_select_number', options: unfiredAtNumbers}),
        formatMessage(MessageFormat.Button, "Fire", { actionId: "updategamestate", buttonFormat: ButtonFormat.Primary, value: [gameID, "fire"].join(" ") })
    ]);
};
    

const getForfeitButton = (gameID: string): FormattedMessage => formatMessage(MessageFormat.Actions, '', [
    formatMessage(MessageFormat.Button, "Forfeit", { actionId: "forfeitgame", buttonFormat: ButtonFormat.Danger, value: gameID })]
);

const getShipPlacementControls = (gameID: string, shipType: ShipType, start: Position[], end?: Position[]): FormattedMessage => {
    const actions: FormattedMessage[] = [];
    actions.push(formatMessage(MessageFormat.Dropdown, "Start", { 
        actionId: 'action_select_start', 
        options: start.map(p => `${p.letter}${p.number}`),
        initial: start.length === 1 ? `${start[0].letter}${start[0].number}` : undefined
    }));
    if(end) {
        actions.push(formatMessage(MessageFormat.Dropdown, "End", { actionId: 'action_select_end', options: end.map(p => `${p.letter}${p.number}`)}));
    }
    actions.push(formatMessage(MessageFormat.Button, `Place ${ShipType[shipType]}`, { actionId: "updategamestate", buttonFormat: ButtonFormat.Primary, value: [gameID, "placeship", ShipType[shipType]].join(" ") }));
    return formatMessage(MessageFormat.Actions, '', actions);
}

const getPositionForCoordinate = (boardSize: number, letter: string, num: number): Position => ({
    letter,
    number: num,
    index: (boardSize * (num - 1)) + (letter.charCodeAt(0) - STARTING_CHAR_CODE)
});

const getPositionForIndex = (boardSize: number, index: number): Position => ({
    letter: String.fromCharCode((index % boardSize) + STARTING_CHAR_CODE),
    number: Math.floor(index / boardSize) + 1,
    index: index
});

const parsePosition = (boardSize: number, input: string): Position => getPositionForCoordinate(boardSize, input.charAt(0), parseInt(input.charAt(1)));

const getValidPlacementPositions = (board: GameBoard, faction: Faction, shipType: ShipType): Position[] => 
{
    const emptySquares = board.squares.filter((sq: GameSquare) => !sq.ships.hasOwnProperty(faction));
    const squaresWithAvailablePositions = emptySquares.filter(sq => getValidEndPositions(board, faction, sq.position, shipType).length > 0);
    const availablePositions = squaresWithAvailablePositions.map(sq => sq.position);
    return availablePositions;
};

const getPositionsWithSuccessfulAttacks = (board: GameBoard, faction: Faction): Position[] => 
    board.squares.filter(sq => sq.attackedBy.includes(faction) && sq.ships.hasOwnProperty(getOpposition(faction))).map(sq => sq.position);

const getValidFiringPositions = (board: GameBoard, faction: Faction): Position[] => board.squares.filter(sq => !sq.attackedBy.includes(faction)).map(sq => sq.position);

const getAdjacentPositions = (board: GameBoard, start: Position) => getPositionsInRange(board, start, 1);

const getBestFiringPositions = (board: GameBoard, faction: Faction): Position[] => {
    const nearHits = getPositionsWithSuccessfulAttacks(board, faction)
                        .flatMap(p => getAdjacentPositions(board, p)
                        .map(p => board.squares[p.index])
                        .filter(sq => !sq.attackedBy.includes(faction))
                    );
    return nearHits.map(sq => sq.position);
};

const previousLetter = (letter:string, numBack: number = 1): string => String.fromCharCode(letter.charCodeAt(0)-numBack);
const nextLetter = (letter:string, numBack: number = 1): string => String.fromCharCode(letter.charCodeAt(0)+numBack);

const getPositionsInRange = (board: GameBoard, from: Position, distance: number): Position[] => {
    const inRange: Position[] = []
    // North
    if(from.number - distance > 0) {
        inRange.push(getPositionForCoordinate(board.gridSize, from.letter, from.number - distance));
    }
    // East
    if(from.letter.charCodeAt(0) + distance < STARTING_CHAR_CODE + board.gridSize) {
        inRange.push(getPositionForCoordinate(board.gridSize, nextLetter(from.letter, distance), from.number));
    }
    // South
    if(from.number + distance <= board.gridSize) {
        inRange.push(getPositionForCoordinate(board.gridSize, from.letter, from.number + distance));
    }
    // West
    if(from.letter.charCodeAt(0) - distance >= STARTING_CHAR_CODE) {
        inRange.push(getPositionForCoordinate(board.gridSize, previousLetter(from.letter, distance), from.number));
    }
    return inRange;
}

const getValidEndPositions = (board: GameBoard, faction: Faction, startPosition: Position, shipType: ShipType): Position[] => {
    // check bounds
    const numExtraSquaresForShip = getLengthOfShipByType(shipType) - 1;
    const inBoundsEndpoints: Position[] = getPositionsInRange(board, startPosition, numExtraSquaresForShip);

    // get Positions between start and end
    const validEndpoints: Position[] = [];
    for(let potentialEndpoint of inBoundsEndpoints) {
        const segments = getPositionsBetween(board, startPosition, potentialEndpoint);
        if(segments.every(s => !positionHasShip(board, s, faction))) {
            validEndpoints.push(potentialEndpoint);
        }
    }
    // return those end positions where all segments between are clear
    return validEndpoints.filter(e => e.index >= 0);
};

// Inclusive
const getPositionsBetween = (board: GameBoard, start: Position, end: Position): Position[] => {
    if(start.letter === end.letter) {
        const lesserNumber = Math.min(start.number, end.number);
        const greaterNumber = Math.max(start.number, end.number);
        const letterPositions: Position[] = [];
        for(let i = lesserNumber; i <= greaterNumber; i++) {
            letterPositions.push(getPositionForCoordinate(board.gridSize, start.letter, i));
        }
        return letterPositions;
    }
    if(start.number === end.number) {
        const lesserChar = Math.min(start.letter.charCodeAt(0), end.letter.charCodeAt(0));
        const greaterChar = Math.max(start.letter.charCodeAt(0), end.letter.charCodeAt(0));
        const numberPositions: Position[] = [];
        for(let char = lesserChar; char <= greaterChar; char++) {
            numberPositions.push(getPositionForCoordinate(board.gridSize, String.fromCharCode(char), start.number));
        }
        return numberPositions;
    }

    return [];
};

const positionHasShip = (board: GameBoard, position: Position, faction: Faction): boolean => {
    const targetSquare = board.squares[position.index];
    return targetSquare.ships.hasOwnProperty(faction);
};

const getWinner = (board: GameBoard): Winner | null => {
    const playerHasWon = board.squares.filter(sq => sq.ships.hasOwnProperty("Bot")).every(sq => sq.attackedBy.includes("Player"));
    const botHasWon = board.squares.filter(sq => sq.ships.hasOwnProperty("Player")).every(sq => sq.attackedBy.includes("Bot"));
    if(playerHasWon && botHasWon) {
        return "Tie";
    }
    if(playerHasWon) {
        return "Player";
    }
    if(botHasWon) {
        return "Bot";
    }
    return null;
};

export class BattleshipGame extends Game {
    board?: GameBoard;

    constructor(services: ServiceCollection, gameState?: BattleshipGameState) {
        super(gameState?.name || "Battleship", gameState?._id || uuid(), services, gameState?.messageID);
        if(gameState) {
            this.board = gameState.board;
        }
    }

    getState(): BattleshipGameState {
        if(!this.board || !this.messageID) {
            throw new Error(`Game Stats require both a board and messageID`);
        }
        return {
            _id: this.gameID,
            isComplete: this.isComplete,
            board: this.board,
            messageID: this.messageID,
            name: this.name,
            type: "gameState"
        };
    }

    async start (command: Command) {
        this.board = generateBoard();
        const startingPositions = getValidPlacementPositions(this.board, "Player", ShipType.Carrier);
        const gameConfirmation = await this._printGame(command, {
            endOfGame: false,
            displayFireControls: false,
            displayTargetingBoard: false,
            displayShipPlacementControls: true,
            placementControls: {
                shipType: ShipType.Carrier,
                initialPositions: startingPositions
            }
        });
        const gameMessageID = gameConfirmation.messageID;
        if(gameMessageID) {
            this.messageID = gameMessageID;
        }

        super.start(command);
    };

    async updateState (action: string, params: string[], command: Command): Promise<BattleshipGameState> {
        if(!this.messageID || !this.board) {
            // Game not initialized
            throw new Error(`Attempted to update state on a game that hasn't been initialized`);
        }

        switch(action) {
            case "placeship":
                const shipType: ShipType = ShipType[params[0]];
                switch(params.length) {
                    case 1:
                        // Give the list of initial placement locations
                        const initialLocations = getValidPlacementPositions(this.board, "Player", shipType);
                        await this._printGame(command, {
                            endOfGame: false,
                            displayFireControls: false,
                            displayTargetingBoard: false,
                            displayShipPlacementControls: true,
                            placementControls: {
                                shipType,
                                initialPositions: initialLocations
                            }
                        });
                        break;
                    case 2:
                        // Give the list of potential end placement locations
                        const initialPosition = parsePosition(this.board.gridSize, params[1]);
                        const endPositions = getValidEndPositions(this.board, "Player", initialPosition, shipType);
                        await this._printGame(command, {
                            endOfGame: false,
                            displayFireControls: false,
                            displayTargetingBoard: false,
                            displayShipPlacementControls: true,
                            placementControls: {
                                shipType,
                                initialPositions: [initialPosition], endPositions
                            }
                        });
                        break;
                    case 3:
                    default:
                        const from = parsePosition(this.board.gridSize, params[1]);
                        const to = parsePosition(this.board.gridSize, params[2]);
                        // Place the ship and queue the next ship or add fire controls
                        const newShip: Ship = {
                            faction: "Player", 
                            type: shipType,
                            segments: []
                        };
                        addShipToBoard(this.board, newShip, from, to);

                        let nextShipType: ShipType | null = null;
                        switch(shipType) {
                            case ShipType.Carrier:
                                nextShipType = ShipType.Battleship;
                                break;
                            case ShipType.Battleship:
                                nextShipType = ShipType.Cruiser;
                                break;
                            case ShipType.Cruiser:
                                nextShipType = ShipType.Submarine;
                                break;
                            case ShipType.Submarine:
                                nextShipType = ShipType.Destroyer;
                                break;
                        }
                        if(nextShipType) {
                            const nextPositions = getValidPlacementPositions(this.board, "Player", nextShipType);
                            await this._printGame(command, {
                                endOfGame: false,
                                displayFireControls: false,
                                displayTargetingBoard: false,
                                displayShipPlacementControls: true,
                                placementControls: {
                                    shipType: nextShipType,
                                    initialPositions: nextPositions
                                }
                            });
                        } else {
                            // The game's ready to be played
                            await this._printGame(command, {
                                endOfGame: false,
                                displayFireControls: true,
                                displayShipPlacementControls: false,
                                displayTargetingBoard: true
                            });
                        }
                        break;
                }
                break;
            case "fire":
                if(params.length < 2) {
                    return this.getState();
                }
                const targetPosition = getPositionForCoordinate(this.board.gridSize, params[0], parseInt(params[1]));
                const targetSquare = this.board.squares[targetPosition.index];
                if(targetSquare.attackedBy.includes("Player")) {
                    return this.getState();
                }
                targetSquare.attackedBy.push("Player");
                const isHit = positionHasShip(this.board, targetPosition, "Bot");

                // Return fire
                const botFiringPositions = getValidFiringPositions(this.board, "Bot");
                const bestFiringPositions = getBestFiringPositions(this.board, "Bot");
                const selectedReturnFire = bestFiringPositions.length > 0 ? randomElement(bestFiringPositions) : randomElement(botFiringPositions);
                const botTargetSquare = this.board.squares[selectedReturnFire.index];
                botTargetSquare.attackedBy.push("Bot");
                const botHits = positionHasShip(this.board, selectedReturnFire, "Player");
                const hits = [
                    `You ${action} at ${params.join("")}`,
                    isHit ? `${ICONS.Hit} Hit!` : `${ICONS.Miss} Miss`,
                    `${command.bot.getName()} ${action}s at ${selectedReturnFire.letter}${selectedReturnFire.number}`,
                    botHits ? `${ICONS.Hit} Hit!` : `${ICONS.Miss} Miss`
                ];

                const winner = getWinner(this.board);
                const isWinner = winner !== null;
                if(isWinner) {
                    switch(winner) {
                        case "Bot": hits.push(`${command.bot.getName()} wins!`); break;
                        case "Player": hits.push(`You win!`); break;
                        case "Tie": hits.push(`Tie!`); break;
                    }
                }

                await this._printGame(command, {
                    endOfGame: isWinner,
                    displayFireControls: !isWinner,
                    displayShipPlacementControls: false,
                    displayTargetingBoard: true
                }, hits);
                this.isComplete = isWinner;
                break;
        }

        super.updateState(action, params, command);

        return this.getState();
    };

    async forfeit (command: Command) {
        if(!this.messageID || !this.board) {
            // Game not initialized
            throw new Error(`Attempted to forfeit a game that hasn't been initialized`);
        }

        if(this.board && this.messageID) {
            await this._printGame(command, {
                endOfGame: true,
                displayFireControls: false,
                displayShipPlacementControls: false,
                displayTargetingBoard: true
            }, ["Player Forfeited"]);
        }
        super.forfeit(command);
    };

    async _printGame (command: Command, options: GameDisplayOptions, infoLines?: string[]) {
        const content: FormattedMessage[] = [
            formatMessage(MessageFormat.Header, this.name)
        ];
        if(!options.endOfGame) {
            content.push(getForfeitButton(this.gameID));
        }
        if(this.board) {
            if(options.displayTargetingBoard) {
                content.push(...[
                    formatMessage(MessageFormat.Markdown, options.endOfGame ? `${command.bot.getName()}'s Fleet` : `*Targeting*`),
                    formatBoard(this.board, {
                        displayShips: options.endOfGame,
                        faction: "Bot"
                    }),
                ]);
            }

            content.push(...[
                formatMessage(MessageFormat.Markdown, `*Your Fleet*`),
                formatBoard(this.board, {
                    displayShips: true,
                    faction: "Player"
                })
            ]);
        }
        if(options.displayShipPlacementControls && options.placementControls) {
            content.push(getShipPlacementControls(
                this.gameID, 
                options.placementControls.shipType, 
                options.placementControls.initialPositions,
                options.placementControls.endPositions
            ));
        }
        if(infoLines) {
            content.push(...infoLines.map(info => formatMessage(MessageFormat.Markdown, info)));
        }
        if(this.board && options.displayFireControls) {
            content.push(getFireControls(this.gameID, this.board));
        }
        return await this._display(command, content);
    }

    async _display (command: Command, content: string | FormattedMessage[]): Promise<MessageConfirmation> {
        if(this.messageID) {
            return await command.bot.updateMessage(
                command.channelID,
                content,
                this.messageID
            );
        } else {
            return await command.respond(content);
        }
    }
}