import { SlashCommandBuilder } from "discord.js";
import * as Discord from "discord.js";

const ping: iCommandInteraction = {
	name: "ping",
	type: "COMMAND",
	data: new SlashCommandBuilder()
	.setName("ping")
	.setDescription("Replies if the bot is online."),
	execute(interaction: Discord.CommandInteraction){
		if(interaction.isRepliable()) {
			interaction.reply({content: `Ping Pong, your latency is long! (${Date.now() - interaction.createdTimestamp}ms)`});
		}
	}
};

module.exports = ping;