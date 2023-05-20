import { SlashCommandBuilder } from "discord.js";
import { ICommandInteraction } from "../../interaction-types";

export default {
	name: "ping",
	type: "COMMAND",
	data: new SlashCommandBuilder()
	.setName("ping")
	.setDescription("Replies if the bot is online."),
	execute({interaction}){
		if(interaction.isRepliable()) {
			interaction.reply({ephemeral: true, content: `Ping Pong, my latency is long! (${Date.now() - interaction.createdTimestamp}ms)`});
		}
	}
} satisfies ICommandInteraction;