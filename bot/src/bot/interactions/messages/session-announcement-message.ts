import DiscordClient, { ChannelParameterType } from "../../discord-client";
import Provider from "../../../provider";
import joinSessionButton from "../buttons/join-session-button";
import Session from "../../../session/session";
import constants from "../../../utils/constants";
import utils from "../../../utils/utils";
import sessionEmbedUtils from "../../../utils/session-embed-utils";
import { SimpleMessageData } from "../../../types/document-types";
import { Message, ActionRowBuilder, ButtonBuilder, EmbedBuilder } from "discord.js";

export default class SessionAnnouncementMessage {
	private constructor(private readonly message: Message) {
		
	}

	public get data(): SimpleMessageData {
		return {messageId: this.message.id, channelId: this.message.channelId}
	}

	public static async recreate(provider: Provider, session: Session, data: SimpleMessageData) {
		const discordClient = provider.get(DiscordClient);
		const message = await discordClient.getMessage(data.channelId, data.messageId);
		if (!message) {
			throw new Error("Unable to recreate announcement message because message can't be found.");
		}

		const announcementMessage = new SessionAnnouncementMessage(message);
		await announcementMessage.update(session);
		return announcementMessage;
	}

	public static async createNew(provider: Provider, session: Session, channel: ChannelParameterType) {
		const discordClient = provider.get(DiscordClient);
		const message = await discordClient.sendMessage(channel, {
			embeds: [
				await SessionAnnouncementMessage.createEmbed(session),
			],
			components: [
				new ActionRowBuilder<ButtonBuilder>().addComponents(joinSessionButton.create({sessionId: session.id}))
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

		const embedBuilder = new EmbedBuilder()
			.setTitle(session.blueprint.name)
			.setAuthor({
				name: host?.displayName ?? "",
				iconURL: host?.user.avatarURL() ?? undefined,
			})
			.setColor(constants.mainColor)
			.setDescription(session.blueprint.description)

		const fields = [
			sessionEmbedUtils.createEditionField(session),
			sessionEmbedUtils.createCategoryField(session),
			sessionEmbedUtils.createCommuncationField(session),
			sessionEmbedUtils.createExperienceField(session),
			sessionEmbedUtils.createEstimateField(session),
		].filter(utils.getHasValuePredicate());

		const fieldsInColumns = sessionEmbedUtils.fieldsIn2Columns(fields);
		for (const field of fieldsInColumns) {
			embedBuilder.addFields(field);
		}

		embedBuilder.addFields({name: " ", value: " ", inline: false});
		embedBuilder.addFields({name: " ", value: " ", inline: false});
		embedBuilder.addFields(sessionEmbedUtils.createPlayerCountField(session));

		if (session.blueprint.image) {
			embedBuilder.setImage(session.blueprint.image);
		}
	
		return embedBuilder.toJSON();
	}
}