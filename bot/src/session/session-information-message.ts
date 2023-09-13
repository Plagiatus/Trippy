import * as Discord from "discord.js";
import DiscordClient from "../bot/discord-client";
import Provider from "../provider";
import { SessionBlueprint } from "../types/session-blueprint-types";
import leaveSessionButton from "../bot/interactions/buttons/leave-session-button";
import constants from "../utils/constants";
import sessionEmbedUtils from "./session-embed-utils";
import utils from "../utils/utils";
import Session from "./session";

export default class SessionInformationMessage {
	private constructor(private readonly message: Discord.Message) {
		
	}

	public get messageId() {
		return this.message.id;
	}

	public static async recreate(provider: Provider, sessionMainChannelId: string, messageId: string, session: Session) {
		const discordClient = provider.get(DiscordClient);
		const message = await discordClient.getMessage(sessionMainChannelId, messageId);
		if (!message) {
			throw new Error("Unable to recreate because message can't be found.");
		}

		const informationMessage = new SessionInformationMessage(message);
		await informationMessage.update(session);
		return informationMessage;
	}

	public static async createNew(provider: Provider, sessionMainChannelId: string, session: Session) {
		const discordClient = provider.get(DiscordClient);
		const message = await discordClient.sendMessage(sessionMainChannelId, {
			embeds: [
				await SessionInformationMessage.createEmbed(session),
			],
			components: [
				new Discord.ActionRowBuilder<Discord.ButtonBuilder>().addComponents(leaveSessionButton.create(session.id))
			]
		});

		return new SessionInformationMessage(message);
	}

	public async update(session: Session) {
		await this.message.edit({
			embeds: [
				await SessionInformationMessage.createEmbed(session),
			]
		})
	}

	public async remove() {
		await this.message.delete();
	}

	private static async createEmbed(session: Session) {
		const embedBuilder = new Discord.EmbedBuilder()
			.setTitle(session.blueprint.name)
			.setColor(constants.mainColor)
			.setDescription(session.blueprint.description);

		const fields = [
			sessionEmbedUtils.createEditionField(session),
			await sessionEmbedUtils.createServerOrRealmsField(session),
			sessionEmbedUtils.createResourcepackField(session),
		].filter(utils.getHasValuePredicate());

		const fieldsInColumns = sessionEmbedUtils.fieldsIn2Columns(fields);
		for (const field of fieldsInColumns) {
			embedBuilder.addFields(field);
		}

		embedBuilder.addFields({name: " ", value: " ", inline: false});
		embedBuilder.addFields({name: " ", value: " ", inline: false});
		embedBuilder.addFields(sessionEmbedUtils.createPlayerCountField(session));

		return embedBuilder.toJSON();
	}
}