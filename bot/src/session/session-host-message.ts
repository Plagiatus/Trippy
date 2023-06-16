import * as Discord from "discord.js";
import DiscordClient from "../bot/discord-client";
import Provider from "../provider";
import endSessionButton from "../bot/interactions/buttons/end-session-button";

export default class SessionHostMessage {
	private constructor(private readonly message: Discord.Message) {
		
	}

	public get messageId() {
		return this.message.id;
	}

	public static async recreate(provider: Provider, hostChannelId: string, messageId: string) {
		const discordClient = provider.get(DiscordClient);
		const message = await discordClient.getMessage(hostChannelId, messageId);
		if (!message) {
			throw new Error("Unable to recreate host message because message can't be found.");
		}

		const hostMessage = new SessionHostMessage(message);
		return hostMessage;
	}

	public static async createNew(provider: Provider, hostChannelId: string, sessionId: string) {
		const discordClient = provider.get(DiscordClient);
		const message = await discordClient.sendMessage(hostChannelId, {
			components: [
				new Discord.ActionRowBuilder<Discord.ButtonBuilder>().addComponents(endSessionButton.create(sessionId))
			]
		});

		return new SessionHostMessage(message);
	}

	public async remove() {
		await this.message.delete();
	}
}