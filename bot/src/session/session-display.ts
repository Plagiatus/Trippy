import { CategoryChannel, TextChannel, Role, OverwriteResolvable, ChannelType, Channel, GuildMember, EmbedBuilder, MessagePayload, BaseMessageOptions } from "discord.js";
import SessionVoiceChannels from "../bot/channels/session-voice-channels";
import DiscordClient from "../bot/discord-client";
import ErrorHandler from "../bot/error-handler";
import SessionAnnouncementMessage from "../bot/interactions/messages/session-announcement-message";
import SessionHostMessage from "../bot/interactions/messages/session-host-message";
import SessionInformationMessage from "../bot/interactions/messages/session-information-message";
import Config from "../config";
import Provider from "../provider";
import constants from "../utils/constants";
import Session from "./session";
import { SessionChannels, SessionMessages, SessionRoles } from "../types/document-types";

export default class SessionDisplay {
	private readonly discordClient: DiscordClient;
	private readonly config: Config;
	private readonly errorHandler: ErrorHandler;

	private announcementMessage?: SessionAnnouncementMessage;
	private voiceChannels?: SessionVoiceChannels;
	private informationMessage?: SessionInformationMessage;
	private hostMessage?: SessionHostMessage;
	private categoryChannel?: CategoryChannel;
	private hostChannel?: TextChannel;
	private mainChannel?: TextChannel;
	private sessionRole?: Role;
	private hostRole?: Role;

	public constructor(private readonly provider: Provider, private readonly session: Session) {
		this.discordClient = provider.get(DiscordClient);
		this.config = provider.get(Config);
		this.errorHandler = provider.get(ErrorHandler);
	}

	public async createSessionMessages() {
		if (this.session.rawSession.state !== "new") {
			return;
		}
		
		this.sessionRole = await this.discordClient.createRole({
			name: `Session ${this.session.id}`,
		});

		this.hostRole = await this.discordClient.createRole({
			name: `Session ${this.session.id} Host`
		});

		const permissions: OverwriteResolvable[] = [
			{
				id: this.config.guildId,
				deny: ["ViewChannel"]
			},
			{
				id: this.sessionRole.id,
				allow: ["ViewChannel"]
			},
			this.discordClient.allowAccessToChannelPermissions,
		]

		const hostPermissions: OverwriteResolvable[] = [
			{
				id: this.config.guildId,
				deny: ["ViewChannel"]
			},
			{
				id: this.hostRole.id,
				allow: ["ViewChannel"]
			},
			this.discordClient.allowAccessToChannelPermissions,
		]

		this.categoryChannel = await this.discordClient.createChannel({
			type: ChannelType.GuildCategory,
			name: `Session ${this.session.id}`,
			permissionOverwrites: permissions,
		});

		this.mainChannel = await this.discordClient.createChannel({
			type: ChannelType.GuildText,
			name: "Main",
			permissionOverwrites: permissions,
			parent: this.categoryChannel,
		});

		this.hostChannel = await this.discordClient.createChannel({
			type: ChannelType.GuildText,
			name: "Host",
			permissionOverwrites: hostPermissions,
			parent: this.categoryChannel,
		});

		this.voiceChannels = await SessionVoiceChannels.createNew(this.provider, this.session, this.categoryChannel.id, this.sessionRole.id);
		this.announcementMessage = await SessionAnnouncementMessage.createNew(this.provider, this.session, "sessionList");
		this.informationMessage = await SessionInformationMessage.createNew(this.provider, this.session, this.mainChannel.id,);
		this.hostMessage = await SessionHostMessage.createNew(this.provider, this.session, this.hostChannel.id);

		const hostMember = await this.session.getHost();
		if (hostMember) {
			this.hostRole && await hostMember.roles.add(this.hostRole);
			this.sessionRole && await hostMember.roles.add(this.sessionRole);
		}
	}

	public async reloadSessionMessages() {
		if (this.session.rawSession.state !== "running" && this.session.rawSession.state !== "stopping") {
			throw new Error(`Session can't be reloaded since its state is ${this.session.rawSession.state}.`);
		}

		const reloadErrors: unknown[] = [];

		const sessionRole = await this.discordClient.getRole(this.session.rawSession.roles.mainId);
		if (sessionRole) {
			this.sessionRole = sessionRole;
		} else {
			reloadErrors.push(new Error("Unable to recreate session because session role can't be found."));
		}

		const hostRole = await this.discordClient.getRole(this.session.rawSession.roles.hostId);
		if (hostRole) {
			this.hostRole = hostRole;
		} else {
			reloadErrors.push(new Error("Unable to recreate session because host role can't be found."));
		}

		const categoryChannel = await this.discordClient.getChannel(this.session.rawSession.channels.categoryId)
		if (categoryChannel && categoryChannel.type === ChannelType.GuildCategory) {
			this.categoryChannel = categoryChannel;
		} else {
			reloadErrors.push(new Error("Unable to recreate session because category channel can't be found."));
		}

		const mainChannel = await this.discordClient.getChannel(this.session.rawSession.channels.mainTextId)
		if (mainChannel && mainChannel.type === ChannelType.GuildText) {
			this.mainChannel = mainChannel;
		} else {
			reloadErrors.push(new Error("Unable to recreate session because main text channel can't be found."));
		}

		const hostChannel = await this.discordClient.getChannel(this.session.rawSession.channels.hostId)
		if (hostChannel && hostChannel.type === ChannelType.GuildText) {
			this.hostChannel = hostChannel;
		} else {
			reloadErrors.push(new Error("Unable to recreate session because host channel can't be found."));
		}

		if (this.categoryChannel && this.sessionRole) {
			try {
				this.voiceChannels = await SessionVoiceChannels.recreate(this.provider, this.session, this.session.rawSession.channels.voiceChannels);
			} catch(error) {
				reloadErrors.push(error);
			}
		}

		try {
			this.announcementMessage = this.session.rawSession.state === "running" ? await SessionAnnouncementMessage.recreate(this.provider, this.session, this.session.rawSession.messages.announcement) : undefined;
		} catch(error) {
			reloadErrors.push(error);
		}

		if (this.mainChannel) {
			try {
				this.informationMessage = await SessionInformationMessage.recreate(this.provider, this.session, this.session.rawSession.messages.information);
			} catch(error) {
				reloadErrors.push(error);
			}
		}

		if (this.hostChannel) {
			try {
				this.hostMessage = await SessionHostMessage.recreate(this.provider, this.session, this.session.rawSession.messages.host);
			} catch(error) {
				reloadErrors.push(error);
			}
		}

		if (reloadErrors.length === 1) {
			throw reloadErrors[0];
		} else if (reloadErrors.length > 1) {
			throw reloadErrors;
		}
	}

	public async destroy() {
		if (this.session.rawSession.state === "ended" || this.session.rawSession.state === "new") {
			return;
		}

		try {
			await this.hostRole?.delete();
		} catch (error) {
			this.errorHandler.handleSessionError(this.session, error, "Failed to remove host role.");
		}

		try {
			await this.sessionRole?.delete();
		} catch (error) {
			this.errorHandler.handleSessionError(this.session, error, "Failed to remove session role.");
		}

		try {
			await this.voiceChannels?.remove();
		} catch (error) {
			this.errorHandler.handleSessionError(this.session, error, "Failed to remove voice channels.");
		}

		try {
			await this.announcementMessage?.remove();
		} catch (error) {
			this.errorHandler.handleSessionError(this.session, error, "Failed to remove announcement message.");
		}

		try {
			await this.mainChannel?.delete();
		} catch (error) {
			this.errorHandler.handleSessionError(this.session, error, "Failed to remove main channel.");
		}

		try {
			await this.hostChannel?.delete();
		} catch (error) {
			this.errorHandler.handleSessionError(this.session, error, "Failed to remove host channel.");
		}

		try {
			await this.categoryChannel?.delete();
		} catch (error) {
			this.errorHandler.handleSessionError(this.session, error, "Failed to remove category channel.");
		}

		this.voiceChannels = undefined;
		this.announcementMessage = undefined;
		this.informationMessage = undefined;
		this.hostMessage = undefined;
		this.hostRole = undefined;
		this.sessionRole = undefined;
		this.mainChannel = undefined;
		this.hostChannel = undefined;
		this.categoryChannel = undefined;
	}

	public async handleBlueprintChange() {
		if (this.session.rawSession.state !== "running") {
			return;
		}

		await Promise.all([
			this.voiceChannels?.update(this.session),
			this.informationMessage?.update(this.session),
			this.announcementMessage?.update(this.session),
		]);
	}

	public isChannelForSession(channel: string|Channel): boolean {
		const channelId = typeof channel === "string" ? channel : channel.id;
		return !!(channelId === this.mainChannel?.id || channelId === this.hostChannel?.id || this.voiceChannels?.isVoiceChannelId(channelId));
	}

	public sendEndedMessage(endedByUser: GuildMember) {
		this.sendMessageToPlayers({
			content: this.sessionRole?.toString() ?? "",
			embeds: [
				new EmbedBuilder()
					.setColor(constants.warningColor)
					.setTitle("Session is ending")
					.setDescription(`This session has been stopped by ${endedByUser} and will close in ${this.config.sessionEndingTime / 1000} seconds.`)
			]
		})
	}

	public sendForceEndedMessage(endedByUser: GuildMember) {
		this.sendMessageToPlayers({
			content: this.sessionRole?.toString() ?? "",
			embeds: [
				new EmbedBuilder()
					.setColor(constants.warningColor)
					.setTitle("Session is ending")
					.setDescription(`This session has been forced to end by ${endedByUser} and will close in ${this.config.sessionEndingTime / 1000} seconds.`)
			]
		})
	}

	private sendPlayerJoinedMessage(player: GuildMember) {
		this.sendMessageToPlayers({
			embeds: [
				new EmbedBuilder()
					.setColor(constants.mainColor)
					.setThumbnail(player.user.avatarURL({size: 32}))
					.setDescription(`${player}\n**joined the session.**`)
			]
		})
	}

	private sendPlayerLeftMessage(player: GuildMember) {
		this.sendMessageToPlayers({
			embeds: [
				new EmbedBuilder()
					.setColor(constants.warningColor)
					.setDescription(`${player} left the session.`)
			]
		})
	}

	public async sendMessageToPlayers(message: string|MessagePayload|BaseMessageOptions) {
		if (!this.mainChannel) {
			return;
		}
		
		try {
			await this.mainChannel.send(message);
		} catch(error) {
			this.errorHandler.handleSessionError(this.session, error, "Failed to send message to players.");
		}
	}

	public async addPlayer(player: GuildMember) {
		this.sendPlayerJoinedMessage(player);

		this.announcementMessage?.update(this.session);
		this.informationMessage?.update(this.session);

		if (this.sessionRole) {
			await player.roles.add(this.sessionRole);
		}
	}

	public async removePlayer(player: GuildMember) {
		this.sendPlayerLeftMessage(player);

		this.announcementMessage?.update(this.session);
		this.informationMessage?.update(this.session);

		if (this.sessionRole) {
			await player.roles.remove(this.sessionRole);
		}
	}

	public async removeAnnouncementMessage() {
		await this.announcementMessage?.remove();
		this.announcementMessage = undefined;
	}

	public getChannelsSaveData(): SessionChannels {
		if (!this.categoryChannel) {
			throw new Error("Unable to get save data for category channel since there isn't one for the session.");
		}
		if (!this.hostChannel) {
			throw new Error("Unable to get save data for host channel since there isn't one for the session.");
		}
		if (!this.mainChannel) {
			throw new Error("Unable to get save data for main channel since there isn't one for the session.");
		}
		if (!this.voiceChannels) {
			throw new Error("Unable to get save data for voice channels since there isn't one for the session.");
		}
		

		return {
			categoryId: this.categoryChannel.id,
			hostId: this.hostChannel.id,
			mainTextId: this.mainChannel.id,
			voiceChannels: this.voiceChannels.data,
		}
	}

	public getRolesSaveData(): SessionRoles {
		if (!this.hostRole) {
			throw new Error("Unable to get save data for host role since there isn't one for the session.");
		}
		if (!this.sessionRole) {
			throw new Error("Unable to get save data for main session role since there isn't one for the session.");
		}

		return {
			hostId: this.hostRole.id,
			mainId: this.sessionRole.id,
		}
	}

	public getMessagesSaveData(): SessionMessages {
		if (!this.announcementMessage) {
			throw new Error("Unable to get save data for announcement message since there isn't one for the session.");
		}
		if (!this.hostMessage) {
			throw new Error("Unable to get save data for announcement message since there isn't one for the session.");
		}
		if (!this.informationMessage) {
			throw new Error("Unable to get save data for announcement message since there isn't one for the session.");
		}

		return {
			announcement: this.announcementMessage.data,
			host: this.hostMessage.data,
			information: this.informationMessage.data,
		}
	}
}