import { Message, ActionRowBuilder, ButtonBuilder } from "discord.js";
import Provider from "../../../provider";
import Session from "../../../session/session";
import DiscordClient, { ChannelParameterType } from "../../discord-client";
import endSessionButton from "../buttons/end-session-button";
import createEditSessionButton from "../buttons/create-edit-session-button";
import { SimpleMessageData } from "../../../types/document-types";

export default class SessionHostMessage {
	private constructor(private readonly provider: Provider, private readonly message: Message) {
		
	}

	public get data(): SimpleMessageData {
		return {
			channelId: this.message.channelId,
			messageId: this.message.id,
		}
	}

	public static async recreate(provider: Provider, session: Session, data: SimpleMessageData) {
		const discordClient = provider.get(DiscordClient);
		const message = await discordClient.getMessage(data.channelId, data.messageId);
		if (!message) {
			throw new Error("Unable to recreate host message because message can't be found.");
		}

		const hostMessage = new SessionHostMessage(provider, message);
		hostMessage.update(session);
		return hostMessage;
	}

	public static async createNew(provider: Provider, session: Session, channelId: ChannelParameterType) {
		const discordClient = provider.get(DiscordClient);

		const message = await discordClient.sendMessage(channelId, {
			components: [
				new ActionRowBuilder<ButtonBuilder>().addComponents(
					endSessionButton.create({sessionId: session.id}),
					await createEditSessionButton({provider, forUserId: session.hostId, sessionId: session.id}),
				),
			]
		});

		return new SessionHostMessage(provider, message);
	}

	public async update(session: Session) {
		await this.message.edit({
			components: [
				new ActionRowBuilder<ButtonBuilder>().addComponents(
					endSessionButton.create({sessionId: session.id}),
					await createEditSessionButton({provider: this.provider, forUserId: session.hostId, sessionId: session.id}),
				),
			]
		})
	}

	public async remove() {
		await this.message.delete();
	}
}