import DiscordClient from "../bot/discord-client";
import Provider from "../provider";
import * as Discord from "discord.js";
import joinSessionButton from "../bot/interactions/buttons/join-session-button";
import { SessionBlueprint } from "../types/session-blueprint-types";

export default class SessionAnnouncementMessage {
	private constructor(private readonly message: Discord.Message) {
		
	}

	public get messageId() {
		return this.message.id;
	}

	public static async recreate(provider: Provider, messageId: string, sessionBlueprint: SessionBlueprint, playerCount: number) {
		const discordClient = provider.get(DiscordClient);
		const message = await discordClient.getMessage("sessionList", messageId);
		if (!message) {
			throw new Error("Unable to recreate because message can't be found.");
		}

		const announcementMessage = new SessionAnnouncementMessage(message);
		await announcementMessage.update(sessionBlueprint, playerCount);
		return announcementMessage;
	}

	public static async createNew(provider: Provider, sessionId: string, sessionBlueprint: SessionBlueprint, playerCount: number) {
		const discordClient = provider.get(DiscordClient);
		const message = await discordClient.sendMessage("sessionList", {
			embeds: [
				SessionAnnouncementMessage.createEmbed(sessionBlueprint, playerCount),
			],
			components: [
				new Discord.ActionRowBuilder<Discord.ButtonBuilder>().addComponents(joinSessionButton.create(sessionId))
			]
		});

		return new SessionAnnouncementMessage(message);
	}

	public async update(newBlueprint: SessionBlueprint, playerCount: number) {
		await this.message.edit({
			embeds: [
				SessionAnnouncementMessage.createEmbed(newBlueprint, playerCount),
			]
		})
	}

	public async remove() {
		await this.message.delete();
	}

	private static createEmbed(sessionBlueprint: SessionBlueprint, playerCount: number) {
		return new Discord.EmbedBuilder()
			.setTitle(sessionBlueprint.name)
			.setDescription(sessionBlueprint.description)
			.toJSON()
	}
}