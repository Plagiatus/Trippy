import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v10";
import Config from "./config";
import InteractionCollection from "./bot/interaction-collection";
import Provider from "./provider";


/** updates commands to servers. */

const provider = new Provider()
	.addFactory(Config, () => Config.loadConfigFile(Config.getEnvironmentConfigPath()))
	.addFactory(InteractionCollection, provider => new InteractionCollection(provider, InteractionCollection.importInteractions()));

const interactionCollection = provider.get(InteractionCollection);
const config = provider.get(Config);

const interactionsToUpdate = [
	...interactionCollection.commandInteractions.values(),
	...interactionCollection.contextInteractions.values(),
].map(interaction => interaction.data);

const rest = new REST({ version: "10" }).setToken(config.discordApiToken);
rest.put(Routes.applicationGuildCommands(config.discordAppId, config.guildId), { body: interactionsToUpdate.map(interaction => interaction.toJSON()) })
	.then(() => console.log("Successfully updated application commands"))
	.catch(console.error);