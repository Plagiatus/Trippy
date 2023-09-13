import DiscordClient from "../bot/discord-client";
import ErrorHandler from "../bot/error-handler";
import Config from "../config";
import DatabaseClient from "../database-client";
import Provider from "../provider";
import { RawSession } from "../types/document-types";
import { SessionBlueprint } from "../types/session-blueprint-types";
import constants from "../utils/constants";
import Session from "./session";
import SessionAnnouncementMessage from "./session-announcement-message";
import SessionHostMessage from "./session-host-message";
import SessionInformationMessage from "./session-information-message";
import SessionVoiceChannels from "./session-voice-channels";
import * as Discord from "discord.js";

export default class SessionDisplay {
	private readonly discordClient: DiscordClient;
	private readonly config: Config;
	private readonly databaseClient: DatabaseClient;
	private readonly errorHandler: ErrorHandler;

	private announcementMessage?: SessionAnnouncementMessage;
	private voiceChannels?: SessionVoiceChannels;
	private informationMessage?: SessionInformationMessage;
	private hostMessage?: SessionHostMessage;
	private categoryChannel?: Discord.CategoryChannel;
	private hostChannel?: Discord.TextChannel;
	private mainChannel?: Discord.TextChannel;
	private sessionRole?: Discord.Role;
	private hostRole?: Discord.Role;

	public constructor(private readonly provider: Provider, private readonly session: Session, private readonly rawSession: RawSession) {
		this.discordClient = provider.get(DiscordClient);
		this.config = provider.get(Config);
		this.databaseClient = provider.get(DatabaseClient);
		this.errorHandler = provider.get(ErrorHandler);
	}

	public async createSessionMessages() {
		if (this.rawSession.state !== "new") {
			return;
		}
		
		this.sessionRole = await this.discordClient.createRole({
			name: `Session ${this.session.id}`,
		});

		this.hostRole = await this.discordClient.createRole({
			name: `Session ${this.session.id} Host`
		});

		const permissions: Discord.OverwriteResolvable[] = [
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

		const hostPermissions: Discord.OverwriteResolvable[] = [
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
			type: Discord.ChannelType.GuildCategory,
			name: `Session ${this.session.id}`,
			permissionOverwrites: permissions,
		});

		this.mainChannel = await this.discordClient.createChannel({
			type: Discord.ChannelType.GuildText,
			name: "Main",
			permissionOverwrites: permissions,
			parent: this.categoryChannel,
		});

		this.hostChannel = await this.discordClient.createChannel({
			type: Discord.ChannelType.GuildText,
			name: "Host",
			permissionOverwrites: hostPermissions,
			parent: this.categoryChannel,
		});

		this.voiceChannels = await SessionVoiceChannels.createNew(this.provider, this.categoryChannel, this.rawSession.blueprint, this.sessionRole);
		this.announcementMessage = await SessionAnnouncementMessage.createNew(this.provider, this.session);
		this.informationMessage = await SessionInformationMessage.createNew(this.provider, this.mainChannel.id, this.session);
		this.hostMessage = await SessionHostMessage.createNew(this.provider, this.hostChannel.id, this.session);

		Object.assign(this.rawSession, {
			...this.rawSession,
			state: "running",
			startTime: Date.now(),
			channels: {
				categoryId: this.categoryChannel.id,
				hostId: this.hostChannel.id,
				mainTextId: this.mainChannel.id,
				voiceIds: this.voiceChannels.channelIds,
			},
			roles: {
				hostId: this.hostRole.id,
				mainId: this.sessionRole.id
			},
			messages: {
				announcementId: this.announcementMessage.messageId,
				hostId: this.hostMessage.messageId,
				informationId: this.informationMessage.messageId,
			}
		});

		await this.databaseClient.sessionRepository.add(this.rawSession);
		const hostMember = await this.session.getHost();
		if (hostMember) {
			this.hostRole && await hostMember.roles.add(this.hostRole);
			this.sessionRole && await hostMember.roles.add(this.sessionRole);
		}
	}

	public async reloadSessionMessages() {
		if (this.rawSession.state !== "running" && this.rawSession.state !== "stopping") {
			throw new Error(`Session can't be reloaded since it's state is ${this.rawSession.state}.`);
		}

		const reloadErrors: unknown[] = [];

		const sessionRole = await this.discordClient.getRole(this.rawSession.roles.mainId);
		if (sessionRole) {
			this.sessionRole = sessionRole;
		} else {
			reloadErrors.push(new Error("Unable to recreate session because session role can't be found."));
		}

		const hostRole = await this.discordClient.getRole(this.rawSession.roles.hostId);
		if (hostRole) {
			this.hostRole = hostRole;
		} else {
			reloadErrors.push(new Error("Unable to recreate session because host role can't be found."));
		}

		const categoryChannel = await this.discordClient.getChannel(this.rawSession.channels.categoryId)
		if (categoryChannel && categoryChannel.type === Discord.ChannelType.GuildCategory) {
			this.categoryChannel = categoryChannel;
		} else {
			reloadErrors.push(new Error("Unable to recreate session because category channel can't be found."));
		}

		const mainChannel = await this.discordClient.getChannel(this.rawSession.channels.mainTextId)
		if (mainChannel && mainChannel.type === Discord.ChannelType.GuildText) {
			this.mainChannel = mainChannel;
		} else {
			reloadErrors.push(new Error("Unable to recreate session because main text channel can't be found."));
		}

		const hostChannel = await this.discordClient.getChannel(this.rawSession.channels.hostId)
		if (hostChannel && hostChannel.type === Discord.ChannelType.GuildText) {
			this.hostChannel = hostChannel;
		} else {
			reloadErrors.push(new Error("Unable to recreate session because host channel can't be found."));
		}

		if (this.categoryChannel && this.sessionRole) {
			try {
				this.voiceChannels = await SessionVoiceChannels.recreate(this.provider, this.categoryChannel, this.sessionRole, this.rawSession.channels.voiceIds, this.rawSession.blueprint);
			} catch(error) {
				reloadErrors.push(error);
			}
		}

		try {
			this.announcementMessage = this.rawSession.state === "running" ? await SessionAnnouncementMessage.recreate(this.provider, this.rawSession.messages.announcementId, this.session) : undefined;
		} catch(error) {
			reloadErrors.push(error);
		}

		if (this.mainChannel) {
			try {
				this.informationMessage = await SessionInformationMessage.recreate(this.provider, this.mainChannel.id, this.rawSession.messages.informationId, this.session);
			} catch(error) {
				reloadErrors.push(error);
			}
		}

		if (this.hostChannel) {
			try {
				this.hostMessage = await SessionHostMessage.recreate(this.provider, this.hostChannel.id, this.rawSession.messages.hostId, this.session);
			} catch(error) {
				reloadErrors.push(error);
			}
		}

		if (reloadErrors.length === 1) {
			throw reloadErrors[0];
		} else if (reloadErrors.length > 1) {
			throw reloadErrors;
		}

		if (this.rawSession.state === "stopping") {
			setTimeout(() => {
				this.destroy();
			}, this.config.sessionEndingTime);
		}
	}

	public async destroy() {
		if (this.rawSession.state === "ended" || this.rawSession.state === "new") {
			return;
		}

		Object.assign(this.rawSession, {
			...this.rawSession,
			state: "ended",
			channels: null,
			messages: null,
			roles: null,
			endTime: "endTime" in this.rawSession ? this.rawSession.endTime : Date.now(),
		});

		const voiceChannels = this.voiceChannels;
		const announcementMessage = this.announcementMessage;
		const hostRole = this.hostRole;
		const sessionRole = this.sessionRole;
		const mainChannel = this.mainChannel;
		const hostChannel = this.hostChannel;
		const categoryChannel = this.categoryChannel;

		this.voiceChannels = undefined;
		this.announcementMessage = undefined;
		this.informationMessage = undefined;
		this.hostMessage = undefined;
		this.hostRole = undefined;
		this.sessionRole = undefined;
		this.mainChannel = undefined;
		this.hostChannel = undefined;
		this.categoryChannel = undefined;

		await this.databaseClient.sessionRepository.update(this.rawSession);

		try {
			await hostRole?.delete();
		} catch (error) {
			this.errorHandler.handleSessionError(this.session, error, "Failed to remove host role.");
		}

		try {
			await sessionRole?.delete();
		} catch (error) {
			this.errorHandler.handleSessionError(this.session, error, "Failed to remove session role.");
		}

		try {
			await voiceChannels?.remove();
		} catch (error) {
			this.errorHandler.handleSessionError(this.session, error, "Failed to remove voice channels.");
		}

		try {
			await announcementMessage?.remove();
		} catch (error) {
			this.errorHandler.handleSessionError(this.session, error, "Failed to remove announcement message.");
		}

		try {
			await mainChannel?.delete();
		} catch (error) {
			this.errorHandler.handleSessionError(this.session, error, "Failed to remove main channel.");
		}

		try {
			await hostChannel?.delete();
		} catch (error) {
			this.errorHandler.handleSessionError(this.session, error, "Failed to remove host channel.");
		}

		try {
			await categoryChannel?.delete();
		} catch (error) {
			this.errorHandler.handleSessionError(this.session, error, "Failed to remove category channel.");
		}
	}

	public async changeBlueprint(blueprint: Readonly<SessionBlueprint>) {
		if (this.rawSession.state !== "running") {
			return;
		}

		this.rawSession.blueprint = blueprint;
		await Promise.all([
			this.voiceChannels?.update(blueprint),
			this.informationMessage?.update(this.session),
			this.announcementMessage?.update(this.session),
		]);

		this.rawSession.channels.voiceIds = this.voiceChannels?.channelIds ?? [];
		await this.databaseClient.sessionRepository.update(this.rawSession);
	}

	public isChannelForSession(channel: string|Discord.Channel) {
		const channelId = typeof channel === "string" ? channel : channel.id;
		return channelId === this.mainChannel?.id || channelId === this.hostChannel?.id || this.voiceChannels?.channelIds.includes(channelId);
	}

	public sendEndedMessage(endedByUser: Discord.GuildMember) {
		this.sendMessageToPlayers({
			content: this.sessionRole?.toString() ?? "",
			embeds: [
				new Discord.EmbedBuilder()
					.setColor(constants.warningColor)
					.setTitle("Session is ending")
					.setDescription(`This session has been stopped by ${endedByUser} and will close in ${this.config.sessionEndingTime / 1000} seconds.`)
			]
		})
	}

	public sendForceEndedMessage(endedByUser: Discord.GuildMember) {
		this.sendMessageToPlayers({
			content: this.sessionRole?.toString() ?? "",
			embeds: [
				new Discord.EmbedBuilder()
					.setColor(constants.warningColor)
					.setTitle("Session is ending")
					.setDescription(`This session has been forced to end by ${endedByUser} and will close in ${this.config.sessionEndingTime / 1000} seconds.`)
			]
		})
	}

	private sendPlayerJoinedMessage(player: Discord.GuildMember) {
		this.sendMessageToPlayers({
			embeds: [
				new Discord.EmbedBuilder()
					.setColor(constants.mainColor)
					.setThumbnail(player.user.avatarURL({size: 32}))
					.setDescription(`${player}\n**joined the session.**`)
			]
		})
	}

	private sendPlayerLeftMessage(player: Discord.GuildMember) {
		this.sendMessageToPlayers({
			embeds: [
				new Discord.EmbedBuilder()
					.setColor(constants.warningColor)
					.setDescription(`${player} left the session.`)
			]
		})
	}

	public async sendMessageToPlayers(message: string|Discord.MessagePayload|Discord.BaseMessageOptions) {
		if (!this.mainChannel) {
			return;
		}
		
		try {
			await this.mainChannel.send(message);
		} catch(error) {
			this.errorHandler.handleSessionError(this.session, error, "Failed to send message to players.");
		}
	}

	public async addPlayer(player: Discord.GuildMember) {
		this.sendPlayerJoinedMessage(player);

		this.announcementMessage?.update(this.session);
		this.informationMessage?.update(this.session);

		if (this.sessionRole) {
			await player.roles.add(this.sessionRole);
		}
	}

	public async removePlayer(player: Discord.GuildMember) {
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
}