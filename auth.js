module.exports = {
    users: {
        getAdministrators: () => process.env.PENNYWORTH_ADMINS?.split(",") || []
    },
    discord: {
        getTokens: () => process.env.PENNYWORTH_DISCORD_TOKENS?.split(",") || []
    },
    slack: {
        getConfigs: () => {
            // TODO - Clean this up
            // Format: <BOTTOKEN_0>|<SOCKETTOKEN_0>|<SIGNING_SECRET_0>,<BOTTOKEN_N>|<SOCKETTOKEN_N>|<SIGNING_SECRET_N>
            const configs = [];
            const envVars = process.env.PENNYWORTH_SLACK_CONFIGS?.split(",") || [];
            for(let envVar of envVars) {
                const configTokens = envVar.split("|");
                configs.push({
                    botToken: configTokens[0],
                    appToken: configTokens[1],
                    signingSecret: configTokens[2]
                });
            }
            return configs;
        }
    },
    cocktailDb: {
        getApiKey: () => process.env.PENNYWORTH_COCKTAILDB_APIKEY
    },
    googleImages: {
        getApiKey: () => process.env.PENNYWORTH_GOOGLEIMAGES_APIKEY,
        getEngineId: () => process.env.PENNYWORTH_GOOGLEIMAGES_ENGINEID
    },
    memeGen: {
        getApiKey: () => process.env.PENNYWORTH_MEMEGEN_APIKEY
    }
};