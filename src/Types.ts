import { Logger } from "winston";
import Bot from "./bots/Bot";
import BotManager from "./bots/BotManager";
import Repository from "./Repository";

export enum BotType {
    Discord,
    Slack
};

export enum ChannelType {
    Admininstrators,
    Developers
}

export enum MessageFormat {
    Header,
    Markdown,
    Divider,
    Context,
    Image,
    Subtext,
    Button,
    Checkboxes,
    Actions,
    Dropdown
};

export enum ButtonFormat {
    Standard,
    Primary,
    Danger
};

export type Checkbox = {
    title: string,
    description: string,
    value: string,
    selected: boolean
};

export type FormattedMessage = {
    format: MessageFormat,
    text?: string,
    data?: any
};

export type ServiceCollection = {
    logger: Logger,
    repo: Repository,
    botManager: BotManager
};

export type Command = {
    keyword: string,
    params: string[],
    bot: Bot,
    userID: string,
    channelID: string,
    threadID: string | undefined,
    messageID: string | undefined,
    serverID: string,
    respond: (response: string | FormattedMessage[]) => Promise<MessageConfirmation>
};

export type MessageContext = {
    userID: string,
    channelID: string,
    threadID?: string,
    messageID?: string,
    serverID: string,
    message: string
};

export type CommandContext = {
    userID: string,
    channelID: string,
    threadID?: string,
    messageID?: string,
    serverID: string,
    command: string,
    params: string[],
    bot: Bot
};

export type MessageConfirmation = {
    success: boolean,
    botType: BotType,
    userID: string,
    channelID: string,
    threadID?: string,
    messageID?: string
};

export type CommandEntry = {
    _id: string
    command: string
    params: string[]
    userID: string
    type: string
    botType: BotType
    channelID: string
    serverID: string
    threadID?: string
    messageID?: string
    timestamp: Date
};

export type CommandModule = {
    key: string
    aliases: string[]
    help: {
        displayAsCommand: boolean
        usage: string
        description: string
    }
    execute: (command: Command) => Promise<void>
};

export type PollModule = {
    key: string
    initialize: () => Promise<void>
};

export type PollState = {
    _id: string
    timestamp: Date
    type: string
};

export type GameState = {
    _id: string
    isComplete: boolean
    name: string
    messageID: string
    [x: string | number | symbol]: any;
    type: string
};

export class Game {
    _id: string;
    name: string;
    services: ServiceCollection;
    messageID?: string;

    collection = "games";
    isComplete: boolean = false;

    constructor(name: string, gameID: string, services: ServiceCollection, messageID?: string) {
        this._id = gameID;
        this.name = name;
        this.services = services;
        this.messageID = messageID;
    }

    get gameID() {
        return this._id;
    }

    getState(): GameState {
        return {
            _id: this._id,
            isComplete: this.isComplete,
            name: this.name,
            messageID: this.messageID || '',
            type: "gameState"
        }
    }

    async start(command: Command) {
    }

    async updateState(action: string, params: string[], command: Command): Promise<GameState> {
        return this.getState();
    }

    async forfeit(command: Command) {
    }
}