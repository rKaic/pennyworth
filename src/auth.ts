import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";

const client: SSMClient = new SSMClient({ region: "us-east-1" });

const getParameterFromAws = async (namespace: string, param: string) => {
    try {
        const parameter = await client.send(
            new GetParameterCommand({
                Name: `/applications/pennyworth/${namespace}/${param}`, 
                WithDecryption: true
            }));
        return parameter?.Parameter?.Value;
    } catch {
        return undefined;
    }
};

export const users = {
    getAdministrators: async () => await getParameterFromAws("users", "admins") || []
};

export const discord = {
    getTokens: async () => await getParameterFromAws("discord", "token") || []
};

export const slack = {
    getConfigs: async () => {
        const config = {
            botToken: await getParameterFromAws("slack", "botToken"),
            appToken: await getParameterFromAws("slack", "appToken"),
            signingSecret: await getParameterFromAws("slack", "signingSecret")
        };
        return [config];
    },
    getAdminChannel: async () => ({
        serverID: await getParameterFromAws("slack", "serverID"),
        channelID: await getParameterFromAws("slack", "adminChannelID")
    }) ,
    getDeveloperChannel: async () => ({
        serverID: await getParameterFromAws("slack", "serverID"),
        channelID: await getParameterFromAws("slack", "developerChannelID")
    })    
};

export const repository = {
    getConnectionString: async () => await getParameterFromAws("repository", "connectionString")
};

export const cocktailDb = {
    getApiKey: async () => await getParameterFromAws("cocktaildb", "apiKey")
};

export const googleImages = {
    getApiKey: async () => await getParameterFromAws("google", "apiKey"),
    getEngineId: async () => await getParameterFromAws("google", "engineId")
};

export const memeGen = {
    getApiKey: async () => await getParameterFromAws("memegen", "apiKey")
};