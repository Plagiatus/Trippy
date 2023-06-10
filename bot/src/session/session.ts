import DiscordClient from "../bot/discord-client";
import DatabaseClient from "../database-client";
import Provider from "../provider";
import * as Discord from "discord.js";
import { RawSession } from "../types/document-types";
import { SessionBlueprint } from "../types/session-blueprint-types";
import SessionAnnouncementMessage from "./session-announcement-message";
import SessionVoiceChannels from "./session-voice-channels";
import SessionInformationMessage from "./session-information-message";
import SessionHostMessage from "./session-host-message";
import Config from "../config";

type SessionConstructorParameterType = {
	provider: Provider;
	rawSession: RawSession;
	announcementMessage: SessionAnnouncementMessage;
	voiceChannels: SessionVoiceChannels;
	informationMessage: SessionInformationMessage;
	hostMessage: SessionHostMessage;
	categoryChannel: Discord.CategoryChannel;
	hostChannel: Discord.TextChannel;
	mainChannel: Discord.TextChannel;
	sessionRole: Discord.Role;
	hostRole: Discord.Role;
}
export default class Session {
	private static readonly StoppingTime = 30 * 1000; // 30 seconds.
	private readonly databaseClient: DatabaseClient;
	private readonly discordClient: DiscordClient;
	private readonly config: Config;

	private announcementMessage?: SessionAnnouncementMessage;
	private voiceChannels?: SessionVoiceChannels;
	private informationMessage?: SessionInformationMessage;
	private hostMessage?: SessionHostMessage;
	private categoryChannel?: Discord.CategoryChannel;
	private hostChannel?: Discord.TextChannel;
	private mainChannel?: Discord.TextChannel;
	private sessionRole?: Discord.Role;
	private hostRole?: Discord.Role;

	public constructor(private readonly provider: Provider, private rawSession: RawSession) {
		this.databaseClient = provider.get(DatabaseClient);
		this.discordClient = provider.get(DiscordClient);
		this.config = provider.get(Config);
	}

	public get id() {
		return this.rawSession.id;
	}

	public get state() {
		return this.rawSession.state;
	}

	public get playerCount() {
		return this.rawSession.players.filter(player => player.leaveTime === undefined).length;
	}

	public get maxPlayers() {
		return this.rawSession.blueprint.preferences.players?.max ?? Number.POSITIVE_INFINITY;
	}

	public async join(userId: string) {
		if (this.isUserInSession(userId)) {
			return false;
		}

		this.rawSession.players.push({
			id: userId,
			joinTime: Date.now(),
		});

		await this.databaseClient.sessionRepository.update(this.rawSession);

		if (this.mainChannel) {
			this.mainChannel.send({
				embeds: [
					new Discord.EmbedBuilder()
						.setTitle("New player")
				]
			})
		}

		const joinedMember = await this.discordClient.getMember(userId);
		if (joinedMember && this.sessionRole) {
			await joinedMember.roles.add(this.sessionRole);
		}

		return true;
	}

	public isUserInSession(userId: string) {
		return this.rawSession.players.some(player => player.id === userId && player.leaveTime === undefined);
	}

	public async leave(userId: string) {
		const playerInformation = this.rawSession.players.find(player => player.id === userId && player.leaveTime === undefined);
		if (!playerInformation) {
			return;
		}

		//Updating value in object ref - updating it here updates the value in rawSession.
		playerInformation.leaveTime = Date.now();
		await this.databaseClient.sessionRepository.update(this.rawSession);

		if (this.mainChannel) {
			this.mainChannel.send({
				embeds: [
					new Discord.EmbedBuilder()
						.setTitle("Player left")
				]
			})
		}

		const leftMember = await this.discordClient.getMember(userId);
		if (leftMember && this.sessionRole) {
			await leftMember.roles.remove(this.sessionRole);
		}
	}

	public async startSession() {
		if (this.rawSession.state !== "new") {
			throw new Error(`Session can't be started since it's state is ${this.rawSession.state}.`);
		}

		this.sessionRole = await this.discordClient.createRole({
			name: `Session ${this.rawSession.id}`,
		});

		this.hostRole = await this.discordClient.createRole({
			name: `Session ${this.rawSession.id} Host`
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
			name: `Session ${this.rawSession.id}`,
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
		this.announcementMessage = await SessionAnnouncementMessage.createNew(this.provider, this.rawSession.id, this.rawSession.blueprint, 0);
		this.informationMessage = await SessionInformationMessage.createNew(this.provider, this.mainChannel.id, this.rawSession.id, this.rawSession.blueprint);
		this.hostMessage = await SessionHostMessage.createNew(this.provider, this.hostChannel.id, this.rawSession.id);

		this.rawSession = {
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
		}

		await this.databaseClient.sessionRepository.add(this.rawSession);
		const hostMember = await this.discordClient.getMember(this.rawSession.hostId);
		if (hostMember) {
			this.hostRole && await hostMember.roles.add(this.hostRole);
			this.sessionRole && await hostMember.roles.add(this.sessionRole);
		}
	}

	public async reloadSession() {
		if (this.rawSession.state !== "running" && this.rawSession.state !== "stopping") {
			throw new Error(`Session can't be reloaded since it's state is ${this.rawSession.state}.`);
		}

		const sessionRole = await this.discordClient.getRole(this.rawSession.roles.mainId);
		if (!sessionRole) {
			throw new Error("Unable to recreate session because session role can't be found.");
		}
		this.sessionRole = sessionRole;

		const hostRole = await this.discordClient.getRole(this.rawSession.roles.hostId);
		if (!hostRole) {
			throw new Error("Unable to recreate session because host role can't be found.");
		}
		this.hostRole = hostRole;

		const categoryChannel = await this.discordClient.getChannel(this.rawSession.channels.categoryId)
		if (!categoryChannel || categoryChannel.type !== Discord.ChannelType.GuildCategory) {
			throw new Error("Unable to recreate session because category channel can't be found.");
		}
		this.categoryChannel = categoryChannel;

		const mainChannel = await this.discordClient.getChannel(this.rawSession.channels.mainTextId)
		if (!mainChannel || mainChannel.type !== Discord.ChannelType.GuildText) {
			throw new Error("Unable to recreate session because main text channel can't be found.");
		}
		this.mainChannel = mainChannel;

		const hostChannel = await this.discordClient.getChannel(this.rawSession.channels.hostId)
		if (!hostChannel || hostChannel.type !== Discord.ChannelType.GuildText) {
			throw new Error("Unable to recreate session because host channel can't be found.");
		}
		this.hostChannel = hostChannel;

		this.voiceChannels = await SessionVoiceChannels.recreate(this.provider, categoryChannel, sessionRole, this.rawSession.channels.voiceIds, this.rawSession.blueprint);
		this.announcementMessage = this.rawSession.state === "running" ? await SessionAnnouncementMessage.recreate(this.provider, this.rawSession.messages.announcementId, this.rawSession.blueprint, this.rawSession.players.length) : undefined;
		this.informationMessage = await SessionInformationMessage.recreate(this.provider, mainChannel.id, this.rawSession.messages.informationId, this.rawSession.blueprint);
		this.hostMessage = await SessionHostMessage.recreate(this.provider, hostChannel.id, this.rawSession.messages.hostId);

		if (this.rawSession.state === "stopping") {
			setTimeout(() => {
				this.fullEndSession();
			}, Session.StoppingTime);
		}
	}

	public async tryStopSession(endingUser: Discord.User): Promise<boolean> {
		if (endingUser.id !== this.rawSession.hostId || this.rawSession.state !== "running") {
			return false;
		}

		if (this.mainChannel) {
			this.discordClient.sendMessage(this.mainChannel, "Session has been ended.");
		}

		await this.stopSession();
		return true;
	}

	public async forceStopSession(endingUser: Discord.User) {
		if (this.rawSession.state !== "running") {
			return;
		}

		if (this.mainChannel) {
			this.discordClient.sendMessage(this.mainChannel, "Session has been force ended by: " + endingUser.username);
		}

		await this.stopSession();
	}

	public async fullEndSession() {
		if (this.rawSession.state === "ended" || this.rawSession.state === "new") {
			return;
		}

		this.rawSession = {
			...this.rawSession,
			state: "ended",
			channels: null,
			messages: null,
			roles: null,
			endTime: "endTime" in this.rawSession ? this.rawSession.endTime : Date.now(),
		}

		const voiceChannels = this.voiceChannels;
		const announcementMessage = this.announcementMessage;
		const informationMessage = this.informationMessage;
		const hostMessage = this.hostMessage;
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
		await voiceChannels?.remove();
		await announcementMessage?.remove();
		await informationMessage?.remove();
		await hostMessage?.remove();
		await hostRole?.delete();
		await sessionRole?.delete();
		await mainChannel?.delete();
		await hostChannel?.delete();
		await categoryChannel?.delete();
	}

	private async stopSession() {
		if (this.rawSession.state !== "running") {
			return;
		}
		
		this.rawSession = {
			...this.rawSession,
			state: "stopping",
			endTime: Date.now(),
			messages: {
				hostId: this.rawSession.messages.hostId,
				informationId: this.rawSession.messages.informationId
			}
		}

		await this.announcementMessage?.remove();
		this.announcementMessage = undefined;
		await this.databaseClient.sessionRepository.update(this.rawSession);

		setTimeout(() => {
			this.fullEndSession();
		}, Session.StoppingTime);
	}

	public static generateSessionId() {
		const idNumber = Math.floor(Math.random() * 2147483648);
		const idString = ("00000000" + (idNumber).toString(16)).slice(-8);

		return idString;
	}
}