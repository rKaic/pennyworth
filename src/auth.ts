import path from "path";
import { config } from "dotenv";

const envPath = process.env.DOTENV_PATH ?? path.resolve(process.cwd(), ".env");
config({ path: envPath });

const toUpperSnake = (s: string) =>
    s.replace(/([a-z0-9])([A-Z])/g, "$1_$2")
        .replace(/[^A-Za-z0-9_]/g, "_")
        .toUpperCase();

const getParameter = async (namespace: string, param: string): Promise<any> => {
    const envKey = `PENNYWORTH_${namespace.toUpperCase()}_${toUpperSnake(param)}`;
    const raw = process.env[envKey];

    if (raw == null) return undefined;

    try {
        return raw.startsWith("{") || raw.startsWith("[") ? JSON.parse(raw) : raw;
    } catch {
        return raw;
    }
};

export const users = {
    getAdministrators: async () => await getParameter("users", "admins") || []
};

export const discord = {
    getTokens: async () => await getParameter("discord", "token") || []
};

export const slack = {
    getConfigs: async () => {
        const config = {
            botToken: await getParameter("slack", "botToken"),
            appToken: await getParameter("slack", "appToken"),
            signingSecret: await getParameter("slack", "signingSecret")
        };
        return [config].filter(c => c.botToken != null);
    },
    getAdminChannel: async () => ({
        serverID: await getParameter("slack", "serverID"),
        channelID: await getParameter("slack", "adminChannelID")
    }) ,
    getDeveloperChannel: async () => ({
        serverID: await getParameter("slack", "serverID"),
        channelID: await getParameter("slack", "developerChannelID")
    })    
};

export const repository = {
    getConnectionString: async () => await getParameter("repo", "connectionString")
};

export const cocktailDb = {
    getApiKey: async () => await getParameter("cocktaildb", "apiKey")
};

