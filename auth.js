const { SSMClient, GetParameterCommand } = require("@aws-sdk/client-ssm");

const client = new SSMClient({ region: "us-east-1" });

const getParameterFromAws = async (namespace, param) => {
    try {
        const parameter = await client.send(new GetParameterCommand({Name: `/applications/pennyworth/${namespace}/${param}`, WithDecryption: true}));
        return parameter?.Parameter?.Value;
    }catch (ex) {
        return null;
    }
}; 

module.exports = {
    users: {
        getAdministrators: async () => await getParameterFromAws("users", "admins") || process.env.PENNYWORTH_ADMINS?.split(",") || []
    },
    discord: {
        getTokens: async () => await getParameterFromAws("discord", "token") || []
    },
    slack: {
        getConfigs: async () => {
            const config = {
                botToken: await getParameterFromAws("slack", "botToken"),
                appToken: await getParameterFromAws("slack", "appToken"),
                signingSecret: await getParameterFromAws("slack", "signingSecret")
            };
            return [config];
        }
    },
    atlassian: {
        getBasicToken: async () => await getParameterFromAws("atlassian", "token") || process.env.PENNYWORTH_ATLASSIAN_BASIC_TOKEN
    },
    cocktailDb: {
        getApiKey: async () => await getParameterFromAws("cocktaildb", "apiKey") || process.env.PENNYWORTH_COCKTAILDB_APIKEY
    },
    googleImages: {
        getApiKey: async () => await getParameterFromAws("google", "apiKey") || process.env.PENNYWORTH_GOOGLEIMAGES_APIKEY,
        getEngineId: async () => await getParameterFromAws("google", "engineId") || process.env.PENNYWORTH_GOOGLEIMAGES_ENGINEID
    },
    memeGen: {
        getApiKey: async () => await getParameterFromAws("memegen", "apiKey") || process.env.PENNYWORTH_MEMEGEN_APIKEY
    }
};