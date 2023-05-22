import { CommandInteraction, EmbedBuilder, Message, MessageType, Interaction } from "discord.js";
import Provider from "../provider";
import DiscordClient from "./discord-client";

export default class ErrorHandler {
	private readonly discordClient: DiscordClient;
	private readonly isHandlingTheBigOnes: boolean = false;
	private readonly errorHandler: ErrorHandler;

	public constructor(provider: Provider) {
		this.discordClient = provider.get(DiscordClient);
		this.errorHandler = provider.get(ErrorHandler);
	}
	
	handleTheBigOnes(){
		if(this.isHandlingTheBigOnes) return;
		process.addListener("unhandledRejection", this.handleGenericError.bind(this));
		process.addListener("uncaughtException", this.handleGenericError.bind(this));
	}

	async handleGenericError(error: unknown) {
		let didSendMessage = false;
		if (error instanceof Error) {
			didSendMessage = await this.discordClient.sendMessage("systemLog", { content: `\`\`\`${error.stack?.substring(0, 4000) }\`\`\``});
		} else if (typeof error === "string") {
			didSendMessage = await this.discordClient.sendMessage("systemLog", { content: "Error: ```" + error.substring(0, 4000) + "```" });
		} else {
			didSendMessage = await this.discordClient.sendMessage("systemLog", { content: "Unexpected error type: ```" + (error + "").substring(0, 4000) + "```" });
		}

		if (!didSendMessage) {
			console.error("Failed to send error message for error:", error);
		}
	}

	async handleInteractionError(error: unknown, messageOrInteraction: Message | Interaction) {
		console.error(error);

		await this.discordClient.sendMessage("systemLog", { embeds: [this.makeEmbed(error, messageOrInteraction)] });
		if ("isRepliable" in messageOrInteraction && messageOrInteraction.isRepliable()) {
			(messageOrInteraction as CommandInteraction).reply({ephemeral: true, content: String(error).substring(0, 4000)});
		}
	}

	private makeEmbed(error: unknown, messageOrInteraction: Message | Interaction): EmbedBuilder {
		if (messageOrInteraction.type == MessageType.Default) {
			return this.makeMessageEmbed(error, messageOrInteraction);
		} else {
			return this.makeInteractionEmbed(error, messageOrInteraction as Interaction);
		}
	}

	private makeMessageEmbed(error: unknown, message: Message): EmbedBuilder {
		return new EmbedBuilder()
			.setTitle("An Error Occured")
			.setFields([
				{ name: "Error", value: "```" + String(error).substring(0, 4000) + "```" },
				{ name: "User", value: message.author.toString() },
				{ name: "Channel", value: message.channel.toString() },
			])
	}

	private makeInteractionEmbed(error: unknown, interaction: Interaction): EmbedBuilder {
		return new EmbedBuilder()
			.setTitle("An Error Occured")
			.setFields([
				{ name: "Error", value: "```" + String(error).substring(0, 4000) + "```" },
				{ name: "User", value: interaction.member?.toString() || "<none>" },
			])
	}
}