import DiscordClient, { ChannelParameterType } from "../../discord-client";
import DependencyProvider from "../../../shared/dependency-provider/dependency-provider";
import joinSessionButton from "../buttons/join-session-button";
import Session from "../../../session/session";
import constants from "../../../utils/constants";
import utils from "../../../utils/utils";
import sessionEmbedUtils from "../../../utils/session-embed-utils";
import { SimpleMessageData } from "../../../types/document-types";
import { Message, ActionRowBuilder, ButtonBuilder, EmbedBuilder, AttachmentBuilder } from "discord.js";
import DatabaseClient from "../../../database-client";
import TimeHelper from "../../../time-helper";

export default class SessionAnnouncementMessage {
	private constructor(private readonly provider: DependencyProvider, private readonly message: Message, private lastImageId: string|undefined|null) {
		
	}

	public get data(): SimpleMessageData {
		return {messageId: this.message.id, channelId: this.message.channelId}
	}

	public static async recreate(provider: DependencyProvider, session: Session, data: SimpleMessageData) {
		const discordClient = provider.get(DiscordClient);
		const message = await discordClient.getMessage(data.channelId, data.messageId);
		if (!message) {
			throw new Error("Unable to recreate announcement message because message can't be found.");
		}

		const announcementMessage = new SessionAnnouncementMessage(provider, message, session.blueprint.imageId);
		await announcementMessage.update(session);
		return announcementMessage;
	}

	public static async createNew(provider: DependencyProvider, session: Session, channel: ChannelParameterType, maySendPing: boolean) {
		const discordClient = provider.get(DiscordClient);
		const embedAndFiles = await SessionAnnouncementMessage.createEmbed(provider, session);

		const shouldSendPing = maySendPing && (session.blueprint.ping ?? false);
		const message = await discordClient.sendMessage(channel, {
			content: shouldSendPing ? '@here' : undefined,
			embeds: [
				embedAndFiles.embed,
			],
			files: embedAndFiles.files,
			components: [
				new ActionRowBuilder<ButtonBuilder>().addComponents(joinSessionButton.create({sessionId: session.id}))
			]
		});

		return new SessionAnnouncementMessage(provider, message, session.blueprint.imageId);
	}

	public async update(session: Session) {
		const embedAndFiles = await SessionAnnouncementMessage.createEmbed(this.provider, session, this.lastImageId);
		this.lastImageId = session.blueprint.imageId;

		const isFull = session.playerCount >= session.maxPlayers;
		await this.message.edit({
			embeds: [
				embedAndFiles.embed,
			],
			files: embedAndFiles.files,
			components: [
				new ActionRowBuilder<ButtonBuilder>().addComponents(joinSessionButton.create({sessionId: session.id, disabled: isFull}))
			]
		})
	}

	public async remove() {
		await this.message.delete();
	}

	private static async createEmbed(provider: DependencyProvider, session: Session, lastImageId?: string|null) {
		const databaseClient = provider.get(DatabaseClient);
		const timeHelper = provider.get(TimeHelper);
		
		const host = await session.getHost();

		const embedBuilder = new EmbedBuilder()
			.setTitle(session.blueprint.name)
			.setAuthor({
				name: host?.displayName ?? "",
				iconURL: host?.user.displayAvatarURL() ?? undefined,
			})
			.setColor(constants.mainColor)
			.setDescription(session.blueprint.description)
			.addFields({name: " ", value: " ", inline: false})
			.addFields({name: " ", value: " ", inline: false})

		const fields = [
			sessionEmbedUtils.createEditionField(session),
			sessionEmbedUtils.createVersionField(session),
			sessionEmbedUtils.createCategoryField(session),
			sessionEmbedUtils.createPlayTypeField(session),
			sessionEmbedUtils.createCommuncationField(session),
			sessionEmbedUtils.createExperienceField(session),
			sessionEmbedUtils.createEstimateField(session),
		].filter(utils.getHasValuePredicate());

		const fieldsInColumns = utils.fieldsInColumns(fields, 2);
		embedBuilder.addFields(...fieldsInColumns);

		embedBuilder.addFields({name: " ", value: " ", inline: false});
		embedBuilder.addFields({name: " ", value: " ", inline: false});
		embedBuilder.addFields(sessionEmbedUtils.createPlayerCountField(session));

		const startedAt = session.rawSession.state === "new" ? timeHelper.currentDate : new Date(session.rawSession.startTime);
		embedBuilder.addFields({
			name: " ",
			value: `Session started ${timeHelper.discordFormatRelativeTime(startedAt)}.`
		});

		let attachment: AttachmentBuilder|null = null;
		if (session.blueprint.imageId) {
			const imageName = `${session.blueprint.imageId}.png`;
			if (session.blueprint.imageId !== lastImageId) {
				const imageData = await databaseClient.imageRepository.get(session.blueprint.imageId);
				if (imageData) {
					const image = new AttachmentBuilder(imageData.imageData.buffer, {name: imageName});
					attachment = image;
				}
			}

			embedBuilder.setImage(`attachment://${imageName}`);
		}
	
		return {
			embed: embedBuilder.toJSON(),
			files: attachment ? [attachment] : (session.blueprint.imageId ? undefined : []),
		}
	}
}