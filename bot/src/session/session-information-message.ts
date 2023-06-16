import * as Discord from "discord.js";
import DiscordClient from "../bot/discord-client";
import Provider from "../provider";
import { SessionBlueprint } from "../types/session-blueprint-types";
import leaveSessionButton from "../bot/interactions/buttons/leave-session-button";
import constants from "../utils/constants";

export default class SessionInformationMessage {
	private constructor(private readonly message: Discord.Message) {
		
	}

	public get messageId() {
		return this.message.id;
	}

	public static async recreate(provider: Provider, sessionMainChannelId: string, messageId: string, sessionBlueprint: SessionBlueprint) {
		const discordClient = provider.get(DiscordClient);
		const message = await discordClient.getMessage(sessionMainChannelId, messageId);
		if (!message) {
			throw new Error("Unable to recreate because message can't be found.");
		}

		const informationMessage = new SessionInformationMessage(message);
		await informationMessage.update(sessionBlueprint);
		return informationMessage;
	}

	public static async createNew(provider: Provider, sessionMainChannelId: string, sessionId: string, sessionBlueprint: SessionBlueprint) {
		const discordClient = provider.get(DiscordClient);
		const message = await discordClient.sendMessage(sessionMainChannelId, {
			embeds: [
				SessionInformationMessage.createEmbed(sessionBlueprint),
			],
			components: [
				new Discord.ActionRowBuilder<Discord.ButtonBuilder>().addComponents(leaveSessionButton.create(sessionId))
			]
		});

		return new SessionInformationMessage(message);
	}

	public async update(newBlueprint: SessionBlueprint) {
		await this.message.edit({
			embeds: [
				SessionInformationMessage.createEmbed(newBlueprint),
			]
		})
	}

	public async remove() {
		await this.message.delete();
	}

	private static createEmbed(sessionBlueprint: SessionBlueprint) {
		return new Discord.EmbedBuilder()
			.setTitle(sessionBlueprint.name)
			.setColor(constants.mainColor)
			.setDescription(sessionBlueprint.description)
			.toJSON()
	}
}