import { formatMessage } from "../core";
import { Command, CommandModule, MessageFormat, ServiceCollection } from "../Types";

export default (services: ServiceCollection): CommandModule[] => {
    const modules: CommandModule[] = [
        {
            key: "outage",
            aliases: [],
            execute: async (command: Command) => {
                await command.respond([
                    formatMessage(MessageFormat.Header, `Air Outages`),
                    formatMessage(MessageFormat.Markdown, `If facing an Air outage during Zurich business hours, please contact Kevin Geyer and Alex Weingarten.\n\nIf during Boston business hours, please contact Will Schubert and Colin Koponen-Robotham.`),
                    formatMessage(MessageFormat.Divider),
                    formatMessage(MessageFormat.Markdown, "Air developers, please see <https://eftours.atlassian.net/wiki/spaces/AIR/pages/385122428/Troubleshooting%2Barticles|this link> for Air Troubleshooting articles."),
                ]);
            },
            help: {
                description: "Displays a link to Air troublshooting runbooks and points to Air team members who can be reached out to.",
                displayAsCommand: true,
                usage: ""
            }
        }
    ];

    return modules;
}