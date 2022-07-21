import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";
import { ContextMenuCommandBuilder, SlashCommandBuilder } from "discord.js";
import { config, interactions } from "../data";


/** updates commands to servers. */

let commands: (SlashCommandBuilder | ContextMenuCommandBuilder)[] = [];

interactions.forEach((interaction) => {
	if (interaction.type == "COMMAND" || interaction.type == "CONTEXT") {
		commands.push(interaction.data);
	}
});

const rest = new REST({ version: "10" }).setToken(config.botToken);

rest.put(Routes.applicationGuildCommands(config.appId, config.serverId), { body: commands.map(command => command.toJSON()) })
	.then(() => console.log("Successfully updated application commands"))
	.catch(console.error);