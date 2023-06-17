import DiscordClient from "../bot/discord-client";
import Provider from "../provider";
import * as Discord from "discord.js";
import joinSessionButton from "../bot/interactions/buttons/join-session-button";
import { SessionBlueprint } from "../types/session-blueprint-types";
import Session from "./session";
import constants from "../utils/constants";

export default class SessionAnnouncementMessage {
	private constructor(private readonly message: Discord.Message) {
		
	}

	public get messageId() {
		return this.message.id;
	}

	public static async recreate(provider: Provider, messageId: string, session: Session) {
		const discordClient = provider.get(DiscordClient);
		const message = await discordClient.getMessage("sessionList", messageId);
		if (!message) {
			throw new Error("Unable to recreate announcement message because message can't be found.");
		}

		const announcementMessage = new SessionAnnouncementMessage(message);
		await announcementMessage.update(session);
		return announcementMessage;
	}

	public static async createNew(provider: Provider, session: Session) {
		const discordClient = provider.get(DiscordClient);
		const message = await discordClient.sendMessage("sessionList", {
			embeds: [
				await SessionAnnouncementMessage.createEmbed(session),
			],
			components: [
				new Discord.ActionRowBuilder<Discord.ButtonBuilder>().addComponents(joinSessionButton.create(session.id))
			]
		});

		return new SessionAnnouncementMessage(message);
	}

	public async update(session: Session) {
		await this.message.edit({
			embeds: [
				await SessionAnnouncementMessage.createEmbed(session),
			]
		})
	}

	public async remove() {
		await this.message.delete();
	}

	private static async createEmbed(session: Session) {
		const host = await session.getHost();

		const playerNames = session.joinedUserIds.map(id => `<@!${id}>`).join("\n");

		return new Discord.EmbedBuilder()
			.setTitle(session.blueprint.name)
			.setAuthor({
				name: host?.displayName ?? "",
				iconURL: host?.user.avatarURL() ?? undefined,
			})
			.setColor(constants.mainColor)
			.setDescription(session.blueprint.description)
			.addFields({name: "Players:", value: `${session.playerCount}/${session.maxPlayers}\n\n${playerNames}`})
			.toJSON()
	}
}