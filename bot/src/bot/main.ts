import * as Discord from "discord.js";
import { config, interactions } from "../data";
import { errorHandler } from "./error";

export const client: Discord.Client = new Discord.Client({ intents: [Discord.GatewayIntentBits.Guilds] });

client.once("ready", async () => {
	console.log("discord connection established.");
});

client.on("interactionCreate", handleInteraction);
client.on("error", handleError);


export async function checkExistanceOfConfigThings() {
	//server
	await client.guilds.fetch()
	let guild = client.guilds.cache.get(config.serverId);
	if (!guild) throw new Error("Specified guild not found.");

	//channels
	await guild.channels.fetch();
	for (let name in config.channels) {
		//@ts-ignore
		let channel: string = config.channels[name];
		if (!guild.channels.cache.has(channel)) {
			throw new Error(`Channel "${name}" not found in guild.`);
		}
		//@ts-ignore
		let perms = guild.channels.cache.get(channel)?.permissionsFor(client.user);
		if (!perms?.has("SendMessages") || !perms.has("ViewChannel")) {
			throw new Error(`Channel "${name}" doesn't have correct permissions.`);
		}
	}
	//roles
	await guild.roles.fetch();
	for (let name in config.roles) {
		//@ts-ignore
		let role: string = config.roles[name];
		if (!guild.roles.cache.has(role)) {
			throw new Error(`Role "${name}" not found in guild.`);
		}
	}

	console.log("config checked against discord server.")
}

function handleInteraction(interaction: Discord.Interaction) {
	if (interaction.type == Discord.InteractionType.ApplicationCommand) executeInteraction(interaction, interaction.commandName);
	else if (interaction.isButton()) executeInteraction(interaction, interaction.customId);
	else if (interaction.isRepliable()){
		interaction.reply({ ephemeral: true, content: `This type of interaction is not supported. If this problem persists, contact a moderator.` });
	}
}

async function executeInteraction(interaction: Discord.Interaction, name: string){
	try {
		if(!interactions.has(name)) throw new Error(`This interaction ("${name}") doesn't exist. Please contact a moderator if this problem persists.`);
		await interactions.get(name)?.execute(interaction);
	} catch (error) {
		errorHandler.handleError(error, interaction);
	}
}

async function handleError(error: Error) {
	errorHandler.handleError(error.stack);
}
