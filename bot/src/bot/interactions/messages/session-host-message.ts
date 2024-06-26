import { Message, ActionRowBuilder, ButtonBuilder } from "discord.js";
import DependencyProvider from "../../../shared/dependency-provider/dependency-provider";
import Session from "../../../session/session";
import DiscordClient, { ChannelParameterType } from "../../discord-client";
import endSessionButton from "../buttons/end-session-button";
import { SimpleMessageData } from "../../../types/document-types";
import editSessionLinkMakerButton from "../buttons/edit-session-link-maker-button";
import utils from "../../../utils/utils";

export default class SessionHostMessage {
	private constructor(private readonly provider: DependencyProvider, private readonly message: Message) {
		
	}

	public get data(): SimpleMessageData {
		return {
			channelId: this.message.channelId,
			messageId: this.message.id,
		}
	}

	public static async recreate(provider: DependencyProvider, session: Session, data: SimpleMessageData) {
		const discordClient = provider.get(DiscordClient);
		const message = await discordClient.getMessage(data.channelId, data.messageId);
		if (!message) {
			throw new Error("Unable to recreate host message because message can't be found.");
		}

		const hostMessage = new SessionHostMessage(provider, message);
		hostMessage.update(session);
		return hostMessage;
	}

	public static async createNew(provider: DependencyProvider, session: Session, channelId: ChannelParameterType) {
		const discordClient = provider.get(DiscordClient);

		const message = await discordClient.sendMessage(channelId, {
			components: [
				new ActionRowBuilder<ButtonBuilder>().addComponents(
					endSessionButton.create({sessionId: session.id}),
					editSessionLinkMakerButton.create({sessionId: session.uniqueId}),
				),
			],
			...utils.createNonceOptions(),
		});

		return new SessionHostMessage(provider, message);
	}

	public async update(session: Session) {
		await this.message.edit({
			components: [
				new ActionRowBuilder<ButtonBuilder>().addComponents(
					endSessionButton.create({sessionId: session.id}),
					editSessionLinkMakerButton.create({sessionId: session.uniqueId}),
				),
			]
		})
	}

	public async remove() {
		await this.message.delete();
	}
}