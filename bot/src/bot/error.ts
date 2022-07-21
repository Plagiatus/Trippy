import { ChannelType, Embed, EmbedBuilder, Guild, Interaction, InteractionType, Message, MessageType } from "discord.js";
import { config } from "../data";
import { client } from "./main";


class ErrorHandler extends EventTarget {
	constructor() {
		super();
		process.addListener("unhandledRejection", this.handleRejection.bind(this));
		process.addListener("uncaughtException", this.handleException.bind(this));
	}

	async handleError(error: any, messageOrInteraction?: Message | Interaction) {
		console.error(error);
		const guild = await client.guilds.fetch(config.serverId);
		const channel = await guild.channels.fetch(config.channels.systemLog);
		
		if (channel && channel.type == ChannelType.GuildText) {
			if (!messageOrInteraction) {
				if(error instanceof Error){
					channel.send({ content: `\`\`\`${error.stack?.substring(0, 4000) }\`\`\``});
				} else {
					channel.send({ content: "Error: ```" + error.substring(0, 4000) + "```" });
				}
			} else {
				channel.send({ embeds: [this.makeEmbed(error, messageOrInteraction)] })
			}
		}
	}

	private makeEmbed(error: any, messageOrInteraction: Message | Interaction): EmbedBuilder {

		if (messageOrInteraction.type == MessageType.Default) {
			return this.makeMessageEmbed(error, messageOrInteraction);
		} else {
			return this.makeInteractionEmbed(error, messageOrInteraction as Interaction);
		}
	}

	private makeMessageEmbed(error: any, message: Message): EmbedBuilder {
		return new EmbedBuilder()
			.setTitle("An Error Occured")
			.setFields([
				{ name: "Error", value: "```" + String(error).substring(0, 4000) + "```" },
				{ name: "User", value: message.author.toString() },
				{ name: "Channel", value: message.channel.toString() },
			])
	}
	private makeInteractionEmbed(error: any, interaction: Interaction): EmbedBuilder {
		return new EmbedBuilder()
			.setTitle("An Error Occured")
			.setFields([
				{ name: "Error", value: "```" + String(error).substring(0, 4000) + "```" },
				{ name: "User", value: interaction.member?.toString() || "<none>" },
			])
	}

	handleRejection(reason: unknown, promise: Promise<unknown>){
		// console.log({reason, promise});
		this.handleError(reason);
	}
	handleException(error: Error, origin: string){
		// console.log({error, origin});
		this.handleError(error);
	}
}

export const errorHandler: ErrorHandler = new ErrorHandler();
