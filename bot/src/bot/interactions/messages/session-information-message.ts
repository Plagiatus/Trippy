import { Message, ActionRowBuilder, ButtonBuilder, EmbedBuilder } from "discord.js";
import DependencyProvider from "../../../shared/dependency-provider/dependency-provider";
import Session from "../../../session/session";
import constants from "../../../utils/constants";
import sessionEmbedUtils from "../../../session-embed-builder";
import utils from "../../../utils/utils";
import DiscordClient, { ChannelParameterType } from "../../discord-client";
import leaveSessionButton from "../buttons/leave-session-button";
import { SimpleMessageData } from "../../../types/document-types";
import stillActiveButton from "../buttons/still-active-button";
import SessionEmbedBuilder from "../../../session-embed-builder";

export default class SessionInformationMessage {
	private constructor(private readonly provider: DependencyProvider, private readonly message: Message) {
		
	}

	public get data(): SimpleMessageData {
		return {
			channelId: this.message.channelId,
			messageId: this.message.id,
		};
	}

	public static async recreate(provider: DependencyProvider, session: Session, data: SimpleMessageData) {
		const discordClient = provider.get(DiscordClient);
		const message = await discordClient.getMessage(data.channelId, data.messageId);
		if (!message) {
			throw new Error("Unable to recreate because message can't be found.");
		}

		const informationMessage = new SessionInformationMessage(provider, message);
		await informationMessage.update(session);
		return informationMessage;
	}

	public static async createNew(provider: DependencyProvider, session: Session, channelId: ChannelParameterType) {
		const discordClient = provider.get(DiscordClient);
		const message = await discordClient.sendMessage(channelId, {
			embeds: [
				await SessionInformationMessage.createEmbed(provider, session),
			],
			components: [
				new ActionRowBuilder<ButtonBuilder>().addComponents([
					leaveSessionButton.create({sessionId: session.id}),
					stillActiveButton.create({sessionId: session.id}),
				])
			]
		});
		await message.pin();

		return new SessionInformationMessage(provider, message);
	}

	public async update(session: Session) {
		await this.message.edit({
			embeds: [
				await SessionInformationMessage.createEmbed(this.provider, session),
			]
		})
	}

	public async remove() {
		await this.message.delete();
	}

	private static async createEmbed(provider: DependencyProvider, session: Session) {
		const sessionEmbedBuilder = provider.get(SessionEmbedBuilder);

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
			.addFields({name: " ", value: " ", inline: false});

		const fields = [
			sessionEmbedBuilder.createEditionField(session),
			sessionEmbedBuilder.createVersionField(session),
			await sessionEmbedBuilder.createServerOrRealmsField(session),
			sessionEmbedBuilder.createResourcepackField(session),
			sessionEmbedBuilder.createCategoryField(session),
			sessionEmbedBuilder.createPlayTypeField(session),
		].filter(utils.getHasValuePredicate());

		const fieldsInColumns = utils.fieldsInColumns(fields, 2);
		embedBuilder.addFields(...fieldsInColumns);

		embedBuilder.addFields({name: " ", value: " ", inline: false});
		embedBuilder.addFields({name: " ", value: " ", inline: false});
		embedBuilder.addFields(sessionEmbedBuilder.createPlayerCountField(session));

		return embedBuilder.toJSON();
	}
}