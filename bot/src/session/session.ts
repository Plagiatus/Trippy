import DiscordClient from "../bot/discord-client";
import DatabaseClient from "../database-client";
import Provider from "../provider";
import * as Discord from "discord.js";
import { RawSession } from "../types/document-types";
import { SessionBlueprint } from "../types/session-blueprint-types";
import SessionDisplay from "./session-display";
import Config from "../config";
import TimeHelper from "../time-helper";

export default class Session {
	private readonly databaseClient: DatabaseClient;
	private readonly discordClient: DiscordClient;
	private readonly timeHelper: TimeHelper;
	private readonly config: Config;

	private readonly display: SessionDisplay;
	private isSetup: boolean;

	public constructor(provider: Provider, private _rawSession: RawSession) {
		this.databaseClient = provider.get(DatabaseClient);
		this.discordClient = provider.get(DiscordClient);
		this.timeHelper = provider.get(TimeHelper);
		this.config= provider.get(Config);
		this.display = new SessionDisplay(provider, this);
		this.isSetup = false;
	}
	
	public get rawSession(): Readonly<RawSession> {
		return this._rawSession;
	}
	private set rawSession(value: RawSession) {
		this._rawSession = value;
	}

	public get id() {
		return this.rawSession.id;
	}

	public get uniqueId() {
		return this.rawSession.uniqueId;
	}

	public get roleId() {
		if ("roles" in this.rawSession) {
			return this.rawSession.roles.mainId;
		}
		throw new Error("Session isn't running so no session role exists.");
	}

	public get state() {
		return this.rawSession.state;
	}

	public get isRunningOrStopping() {
		return this.rawSession.state === "running" || this.rawSession.state === "stopping";
	}

	public get playerCount() {
		return this.rawSession.players.filter(player => player.leaveTime === undefined).length;
	}

	public get maxPlayers() {
		return this.rawSession.blueprint.preferences.players?.max ?? Number.POSITIVE_INFINITY;
	}

	public get blueprint(): Readonly<SessionBlueprint> {
		return this.rawSession.blueprint;
	}

	public get hostId() {
		return this.rawSession.hostId;
	}

	public get joinedUserIds() {
		return this.rawSession.players.filter(player => player.leaveTime === undefined).map(player => player.id);
	}

	public async setup() {
		if (this.isSetup || this.rawSession.state === "ended") {
			return;
		}

		this.isSetup = true;
		if (this.rawSession.state !== "new") {
			await this.display.reloadSessionMessages();
			if (this.rawSession.state === "stopping") {
				setTimeout(() => {
					this.destroy();
				}, this.config.sessionEndingTime);
			}
			return;
		}

		await this.display.createSessionMessages();

		this.rawSession = {
			...this.rawSession,
			state: "running",
			startTime: this.timeHelper.currentDate.getTime(),
			channels: this.display.getChannelsSaveData(),
			roles: this.display.getRolesSaveData(),
			messages: this.display.getMessagesSaveData(),
		}

		await this.databaseClient.sessionRepository.add(this.rawSession);
		if (this.rawSession.blueprint.ping) {
			this.databaseClient.userRepository.updateLastPingTime(this.rawSession.hostId);
		}
	}

	public async destroy() {
		await this.display.destroy();
		this.rawSession = {
			uniqueId: this.rawSession.uniqueId,
			id: this.rawSession.id,
			state: "ended",
			blueprint: this.rawSession.blueprint,
			hostId: this.rawSession.hostId,
			players: this.rawSession.players,
			startTime: "startTime" in this.rawSession ? this.rawSession.startTime : this.timeHelper.currentDate.getTime(),
			endTime: "endTime" in this.rawSession ? this.rawSession.endTime : this.timeHelper.currentDate.getTime(),
		}
		await this.databaseClient.sessionRepository.update(this.rawSession);
	}

	public isChannelForSession(channel: string|Discord.Channel) {
		return this.display.isChannelForSession(channel);
	}

	public async getHost(): Promise<Discord.GuildMember|null> {
		return this.discordClient.getMember(this.rawSession.hostId);
	}

	public async join(userId: string) {
		if (this.isUserInSession(userId)) {
			return false;
		}

		const joinedMember = await this.discordClient.getMember(userId);
		if (!joinedMember) {
			return false;
		}

		this.rawSession.players.push({
			id: userId,
			joinTime: this.timeHelper.currentDate.getTime(),
		});

		await this.databaseClient.sessionRepository.update(this.rawSession);
		await this.display.addPlayer(joinedMember);

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
		playerInformation.leaveTime = this.timeHelper.currentDate.getTime();
		await this.databaseClient.sessionRepository.update(this.rawSession);

		const leftMember = await this.discordClient.getMember(userId);
		if (!leftMember) {
			return;
		}

		await this.display.removePlayer(leftMember);
	}

	public async tryStopSession(endingUser: Discord.GuildMember): Promise<boolean> {
		if (endingUser.id !== this.rawSession.hostId || this.rawSession.state !== "running") {
			return false;
		}

		this.display.sendEndedMessage(endingUser);
		await this.stopSession();
		return true;
	}

	public async forceStopSession(endingUser: Discord.GuildMember) {
		if (this.rawSession.state !== "running") {
			return;
		}

		this.display.sendForceEndedMessage(endingUser);

		await this.stopSession();
	}

	public async changeBlueprint(blueprint: Readonly<SessionBlueprint>) {
		this.rawSession = {
			...this.rawSession,
			blueprint: blueprint,
		};

		await this.display.handleBlueprintChange();
		if (this.rawSession.state === "running" || this.rawSession.state === "stopping") {
			this.rawSession = {
				...this.rawSession,
				channels: this.display.getChannelsSaveData(),
			};
			await this.databaseClient.sessionRepository.update(this.rawSession);
		}
	}

	private async stopSession() {
		if (this.rawSession.state !== "running") {
			return;
		}

		this._rawSession = {
			uniqueId: this.rawSession.uniqueId,
			id: this.rawSession.id,
			state: "stopping",
			blueprint: this.rawSession.blueprint,
			hostId: this.rawSession.hostId,
			players: this.rawSession.players,
			startTime: this.rawSession.startTime,
			endTime: this.timeHelper.currentDate.getTime(),
			channels: this.rawSession.channels,
			messages: {
				host: this.rawSession.messages.host,
				information: this.rawSession.messages.information,
			},
			roles: this.rawSession.roles,
		}

		await this.display.removeAnnouncementMessage();
		await this.databaseClient.sessionRepository.update(this.rawSession);

		setTimeout(() => {
			this.destroy();
		}, this.config.sessionEndingTime);
	}

	public static generateSessionId() {
		const idNumber = Math.floor(Math.random() * 2147483648);
		const idString = ("00000000" + (idNumber).toString(16)).slice(-8);

		return idString;
	}
}