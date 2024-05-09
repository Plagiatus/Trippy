import { CommandInteraction, EmbedBuilder, Message, MessageType, Interaction } from "discord.js";
import DiscordClient from "./discord-client";
import Session from "../session/session";
import constants from "../utils/constants";
import injectDependency from "../shared/dependency-provider/inject-dependency";

export default class ErrorHandler {
	private readonly discordClient = injectDependency(DiscordClient, {reference: true});
	private readonly isHandlingTheBigOnes: boolean = false;
	
	handleTheBigOnes(){
		if(this.isHandlingTheBigOnes) return;
		process.addListener("unhandledRejection", (error) => this.handleGenericError(error));
		process.addListener("uncaughtException", (error) => this.handleGenericError(error));
	}

	async handleGenericError(error: unknown, message?: string) {
		const errorMessage = this.getErrorString(error);
		const didSendMessage = !!await this.discordClient.value.sendMessage("systemLog", {
			content: `${message === undefined ? "" : message + " "}${errorMessage}`
		});

		if (!didSendMessage) {
			console.error("Failed to send error message for error:", error);
		}
	}

	async handleSessionError(session: Session, error: unknown, message?: string) {
		const errorMessage = this.getErrorString(error);
		const didSendMessage = !!await this.discordClient.value.sendMessage("systemLog", {
			content: `[Session ${session.id} ${session.uniqueId}]:${message === undefined ? "" : " " + message} ${errorMessage}`
		});

		if (!didSendMessage) {
			console.error("Failed to send error message for error:", error);
		}
	}

	async handleInteractionError(error: unknown, messageOrInteraction: Message | Interaction) {
		console.error(error);

		await this.discordClient.value.sendMessage("systemLog", { embeds: [this.makeEmbed(error, messageOrInteraction)] });
		if ("isRepliable" in messageOrInteraction && messageOrInteraction.isRepliable()) {
			(messageOrInteraction as CommandInteraction).reply({ephemeral: true, content: String(error).substring(0, 4000)});
		}
	}

	private getErrorString(error: unknown) {
		if (error instanceof Error) {
			return `\`\`\`${error.stack?.substring(0, 4000) }\`\`\``;
		} else if (typeof error === "string") {
			return "Error: ```" + error.substring(0, 4000) + "```";
		} else if (Array.isArray(error) && error.every(element => element instanceof Error)) {
			return "Errors: ```" + error.map(error => (error as Error).message).join("\n") + "```"
		} else {
			return "Unexpected error type: ```" + (error + "").substring(0, 4000) + "```";
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
			.setColor(constants.warningColor)
			.setTitle("An Error Occured")
			.setFields([
				{ name: "Error", value: "```" + String(error).substring(0, 4000) + "```" },
				{ name: "User", value: message.author.toString() },
				{ name: "Channel", value: message.channel.toString() },
			])
	}

	private makeInteractionEmbed(error: unknown, interaction: Interaction): EmbedBuilder {
		return new EmbedBuilder()
			.setColor(constants.warningColor)
			.setTitle("An Error Occured")
			.setFields([
				{ name: "Error", value: "```" + String(error).substring(0, 4000) + "```" },
				{ name: "User", value: interaction.member?.toString() || "<none>" },
			])
	}
}