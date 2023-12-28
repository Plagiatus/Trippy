import * as Discord from "discord.js";
import DiscordClient from "../bot/discord-client";
import Provider from "../provider";
import endSessionButton from "../bot/interactions/buttons/end-session-button";
import Session from "./session";
import createEditSessionButton from "../bot/interactions/buttons/create-edit-session-button";

export default class SessionHostMessage {
	private constructor(private readonly provider: Provider, private readonly message: Discord.Message) {
		
	}

	public get messageId() {
		return this.message.id;
	}

	public static async recreate(provider: Provider, hostChannelId: string, messageId: string, session: Session) {
		const discordClient = provider.get(DiscordClient);
		const message = await discordClient.getMessage(hostChannelId, messageId);
		if (!message) {
			throw new Error("Unable to recreate host message because message can't be found.");
		}

		const hostMessage = new SessionHostMessage(provider, message);
		hostMessage.update(session);
		return hostMessage;
	}

	public static async createNew(provider: Provider, hostChannelId: string, session: Session) {
		const discordClient = provider.get(DiscordClient);

		const message = await discordClient.sendMessage(hostChannelId, {
			components: [
				new Discord.ActionRowBuilder<Discord.ButtonBuilder>().addComponents(
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
				new Discord.ActionRowBuilder<Discord.ButtonBuilder>().addComponents(
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