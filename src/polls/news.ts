import { ChannelType, FormattedMessage, MessageFormat, PollModule, ServiceCollection } from '../Types';
import { formatMessage, isNullOrEmpty } from '../core';
import fetch from 'node-fetch';
import moment from 'moment';

const MORNING_URL = "https://i.imgur.com/EklUYVA.gif";
const IMAGE_NOT_FOUND_URL = "https://i.imgur.com/cG7Br1b.png";
// Weekdays @ 9AM EST
const TARGET_TIME = {
    daysOfWeek: [1,2,3,4,5],
    hour: 14,
    minute: 0
};
let dayLastRun: number = -1;

const isTargetTime = (): boolean => {
    const now = moment.utc();
    return TARGET_TIME.daysOfWeek.includes(now.day()) && 
            now.hours() === TARGET_TIME.hour && 
            now.minute() === TARGET_TIME.minute;
};

type NewsSource = {
    name: string,
    uri: string
};

type Post = {
    source: NewsSource,
    title: string,
    thumbnail: string,
    uri: string
};

const subreddits: NewsSource[] = [
    {
        name: "/r/programming",
        uri: "https://www.reddit.com/r/programming/best.json"
    },
    {
        name: "/r/dotnet",
        uri: "https://www.reddit.com/r/dotnet/best.json"
    },
    {
        name: "/r/csharp",
        uri: "https://www.reddit.com/r/csharp/best.json"
    },
    {
        name: "/r/technology",
        uri: "https://www.reddit.com/r/technology/best.json"
    },
    {
        name: "/r/typescript",
        uri: "https://www.reddit.com/r/typescript/best.json"
    },
    {
        name: "/r/webdev",
        uri: "https://www.reddit.com/r/webdev/best.json"
    },
    {
        name: "/r/netsec",
        uri: "https://www.reddit.com/r/netsec/best.json"
    }
];

const getTopPost = async (source: NewsSource): Promise<Post> => {
    const post = (await(await fetch(source.uri, {
        method: 'GET',
        headers: {
            "Accept": "application/json"
        }
    })).json()).data.children.map(c => c.data).filter(p => !p.is_self)[0];
    return {
        source: source,
        title: post.title,
        thumbnail: post.thumbnail,
        uri: post.url
    };
}

const getTopPosts = async (): Promise<Post[]> => {
    const topPosts = await Promise.all(subreddits.map(getTopPost));
    topPosts.sort((p1, p2) => p1.source.name.localeCompare(p2.source.name));
    return topPosts;
}

export default (services: ServiceCollection): PollModule[] => {
    const pollService = async () => {
        // Check the time - post it every morning
        const runPoll = isTargetTime() && dayLastRun !== moment.utc().day();
        if(!runPoll) {
            return;
        }

        const greetingConfirmations = await services.botManager.sendMessagesToAllBots([
            formatMessage(MessageFormat.Image, MORNING_URL, "Good Morning!"),
            formatMessage(MessageFormat.Markdown, `Happy ${moment.utc().format('dddd')}!`)
        ], ChannelType.Admininstrators);

        services.logger.info(`Polling for news at ${moment.utc().toISOString()}`);
        const topPosts = await getTopPosts();

        const messages: FormattedMessage[] = [
            formatMessage(MessageFormat.Divider),
            formatMessage(MessageFormat.Header, "Top Posts of the Day"),
            ...topPosts.flatMap(post => [ 
                formatMessage(MessageFormat.Context, '', [
                    formatMessage(MessageFormat.Image, isNullOrEmpty(post.thumbnail) ? IMAGE_NOT_FOUND_URL : post.thumbnail, post.title),
                    formatMessage(MessageFormat.Subtext, `<${post.uri}|${post.title}>`)
                ]),
                formatMessage(MessageFormat.Context, '', [
                    formatMessage(MessageFormat.Subtext, `Source: <${post.source.uri.replace(".json", "")}|${post.source.name}>`)
                ]),
                formatMessage(MessageFormat.Divider)
            ])
        ];

        // Reply to the morning greeting in its thread with news and other updates
        await Promise.all(greetingConfirmations.filter(c => c.success).map(c => services.botManager.sendMessagesToBot(messages, c.botType, ChannelType.Admininstrators, c.threadID)));
        dayLastRun = moment.utc().day();
    };

    const modules: PollModule[] = [{
        key: "Daily News",
        initialize: async () => {
            await pollService();
            // Check once a minute
            setInterval(async () => await pollService(), 60000);
        }
    }];

    return modules;
};