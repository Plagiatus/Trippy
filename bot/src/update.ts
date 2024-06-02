import { Routes } from "discord-api-types/v10";
import Config from "./config";
import InteractionCollection from "./bot/interaction-collection";
import DependencyProvider from "./shared/dependency-provider/dependency-provider";
import utils from "./utils/utils";
import DiscordClient from "./bot/discord-client";
import ErrorHandler from "./bot/error-handler";
import Impersonation from "./impersonation";
import DatabaseClient from "./database-client";
import DataUpdater from "./data-updater";
import TimeHelper from "./time-helper";
import DatabaseLegacyClient from "./database-client-legacy";
import RecommendationHelper from "./recommendation-helper";

const provider = new DependencyProvider()
	.addConstructor(DiscordClient)
	.addFactory(Config, () => Config.loadConfigFile(Config.getEnvironmentConfigPath()))
	.addFactory(InteractionCollection, () => new InteractionCollection())
	.addConstructor(ErrorHandler)
	.addConstructor(Impersonation)
	.addConstructor(DatabaseClient)
	.addConstructor(DatabaseLegacyClient)
	.addConstructor(RecommendationHelper)
	.addConstructor(DataUpdater)
	.addConstructor(TimeHelper);

async function updateServerCommands() {
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

async function updateData() {
	const updater = provider.get(DataUpdater);

	try {
		await updater.runUpdates();
		console.log("Successfully updated data");
	} catch(error) {
		console.error("Failed to update data", error);
	}
}


(async () => {
	await updateServerCommands();
	await updateData();
	await provider.get(DatabaseClient).close();
})();