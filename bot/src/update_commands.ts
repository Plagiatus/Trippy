import { Routes } from "discord-api-types/v10";
import Config from "./config";
import InteractionCollection from "./bot/interaction-collection";
import DependencyProvider from "./shared/dependency-provider/dependency-provider";
import utils from "./utils/utils";
import DiscordClient from "./bot/discord-client";
import ErrorHandler from "./bot/error-handler";
import Impersonation from "./impersonation";

async function updateServerCommands() {
	const provider = new DependencyProvider()
		.addConstructor(DiscordClient)
		.addFactory(Config, () => Config.loadConfigFile(Config.getEnvironmentConfigPath()))
		.addFactory(InteractionCollection, () => new InteractionCollection())
		.addConstructor(ErrorHandler)
		.addConstructor(Impersonation);

	const interactionCollection = provider.get(InteractionCollection);
	const config = provider.get(Config);
	const discordClient = provider.get(DiscordClient);

	const interactionsToUpdate = [
		...await utils.asyncMap(interactionCollection.commands, async command => command.create({provider})),
	];

	try {
		await discordClient.restClient.put(Routes.applicationGuildCommands(config.discordAppId, config.guildId), {
			body: interactionsToUpdate.map(interaction => interaction.toJSON())
		});
		console.log("Successfully updated application commands");
	} catch(error) {
		console.error("Failed to update application commands", error);
	}
}

updateServerCommands();