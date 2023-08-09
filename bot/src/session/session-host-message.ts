import * as Discord from "discord.js";
import DiscordClient from "../bot/discord-client";
import Provider from "../provider";
import endSessionButton from "../bot/interactions/buttons/end-session-button";
import editSessionButton from "../bot/interactions/buttons/edit-session-button";
import Config from "../config";
import AuthenticationService from "../authentication-service";
import Session from "./session";

export default class SessionHostMessage {
	private readonly config: Config;
	private readonly authenticationService: AuthenticationService;

	private constructor(provider: Provider, private readonly message: Discord.Message) {
		this.config = provider.get(Config);
		this.authenticationService = provider.get(AuthenticationService);
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
		const config = provider.get(Config);
		const authenticationService = provider.get(AuthenticationService);

		const sessionOverviewUrl = `${config.frontendUrl}/session/${session.id}`;
		const loginAndSessionOverviewUrl = await authenticationService.createLoginLinkWithRedirect(sessionOverviewUrl, session.hostId);

		const message = await discordClient.sendMessage(hostChannelId, {
			components: [
				new Discord.ActionRowBuilder<Discord.ButtonBuilder>().addComponents(
					endSessionButton.create(session.id),
					editSessionButton.create(loginAndSessionOverviewUrl, false),
				),
			]
		});

		return new SessionHostMessage(provider, message);
	}

	public async update(session: Session) {
		const sessionOverviewUrl = `${this.config.frontendUrl}/session/${session.id}`;
		const loginAndSessionOverviewUrl = await this.authenticationService.createLoginLinkWithRedirect(sessionOverviewUrl, session.hostId);

		await this.message.edit({
			components: [
				new Discord.ActionRowBuilder<Discord.ButtonBuilder>().addComponents(
					endSessionButton.create(session.id),
					editSessionButton.create(loginAndSessionOverviewUrl, false),
				),
			]
		})
	}

	public async remove() {
		await this.message.delete();
	}
}