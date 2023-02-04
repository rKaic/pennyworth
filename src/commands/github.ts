import { formatMessage } from '../core';
import { deployTagToEnvironment, getDeployWorkflows, getLatestDeployment, getNextEnvironment, getProject, getReleaseNotes, getServiceUri, getTeamRepos, isPromotable } from '../lib/github';
import { ButtonFormat, Command, CommandModule, MessageFormat, ServiceCollection } from '../Types';

export default (services: ServiceCollection): CommandModule[] => {
    const modules: CommandModule[] = [
        {
            key: "deploy",
            aliases: [],
            execute: async (command: Command) => {
                if(command.params.length != 3) {
                    await command.respond(`Please use the format \`${command.bot.commandParam}deploy <service> <tag> <environment>\``);
                    return;
                }
                const service = command.params[0];
                const tag = command.params[1];
                const env = command.params[2];
                const workflows = await getDeployWorkflows(service);
                const previousDeployment = await getLatestDeployment(service, env);
                const releaseNotes = await getReleaseNotes(service, tag, previousDeployment?.tag);

                // Kick off the deployment
                await Promise.all(workflows.map(w => deployTagToEnvironment(service, tag, env, w)));
                await command.respond([
                    formatMessage(MessageFormat.Markdown, `<${getServiceUri(service)}/actions|Deploying ${service}> at tag <${getServiceUri(service)}/releases/${tag}|${tag}> to the \`${env}\` environment`),
                    formatMessage(MessageFormat.Markdown, releaseNotes.body)
                ]);
            },
            help: {
                description: "Deploys the selected service and tag to the selected environment",
                displayAsCommand: true,
                usage: "<service> <tag> <environment>"
            }
        }, {
            key: "deployments",
            aliases: [],
            execute: async (command: Command) => {
                try {
                    services.logger.info("Retrieving deployments");
                    const responseBlocks = [formatMessage(MessageFormat.Header, `Current Air Service Deployments${command.params.length > 0 ? ` matching ${command.params.join(" or ")}` : ": All Services"}`)];
                    const teamRepos = await getTeamRepos();
                    const reposWithDeployments = teamRepos.filter(repo => repo.deployments_url != null);
                    const selectedRepos = command.params.length > 0 ? reposWithDeployments.filter(repo => command.params.some(param => (new RegExp(param, 'i')).test(repo.name))) : reposWithDeployments;
                    const projectTasks = selectedRepos.map(getProject);
                    const projects = await Promise.all(projectTasks);
                    const deploymentBlocks = projects.filter(p => p.deployments.length > 0).flatMap(p => [
                        formatMessage(MessageFormat.Header, `${p.service}`), 
                        ...(p.deployments.flatMap(d => {
                            const deploymentBlocks = [formatMessage(MessageFormat.Markdown, `Deployed to ${d.env} at tag <${d.uri}|${d.tag}>`)];
                            const nextEnvironment = getNextEnvironment(d.env);
                            if(isPromotable(d.env)) {
                                deploymentBlocks.push(
                                    formatMessage(MessageFormat.Actions, '', [
                                        formatMessage(MessageFormat.Button, `Promote ${d.env} to ${nextEnvironment}`, {
                                            actionId: "deploy",
                                            buttonFormat: ButtonFormat.Primary,
                                            value: `${p.service} ${d.tag} ${nextEnvironment}`,
                                            confirmation: {
                                                title: "Are you sure?", 
                                                text: `This will promote tag ${d.tag} of ${p.service} from ${d.env} to ${nextEnvironment}`, 
                                                yes: "Deploy", 
                                                no: "Cancel" 
                                            }
                                        })
                                    ])
                                );
                            }
                            return deploymentBlocks;
                        }))
                    ]);
                    responseBlocks.push(...deploymentBlocks);
                    await command.respond(responseBlocks);
                } catch(err) {
                    services.logger.error(`Error in the deployments command: ${err.message}`);
                    await command.respond(err.message);
                }
            },
            help: {
                description: "Lists the tags of each Air service deployed to each environment. Supports filtering by one or more service names.",
                displayAsCommand: true,
                usage: "[<name fragment 1> <name fragment 2>...]"
            }
        }
    ];

    return modules;
};