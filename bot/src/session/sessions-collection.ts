import DiscordClient from "../bot/discord-client";
import ErrorHandler from "../bot/error-handler";
import DatabaseClient from "../database-client";
import Provider from "../provider";
import { RawSession } from "../types/document-types";
import { SessionBlueprint } from "../types/session-blueprint-types";
import utils from "../utils/utils";
import Session from "./session";
import * as Discord from "discord.js";

export default class SessionsCollection {
	private readonly databaseClient: DatabaseClient;
	private readonly errorHandler: ErrorHandler;
	private readonly discordClient: DiscordClient;

	private readonly sessions: Session[];
	private runningSessionsCount: number|null;
	
	public constructor(private readonly provider: Provider) {
		this.databaseClient = provider.get(DatabaseClient);
		this.errorHandler = provider.get(ErrorHandler);
		this.discordClient = provider.get(DiscordClient);

		this.sessions = [];
		this.runningSessionsCount = null;
	}

	public get activeSessionsCount() {
		return this.sessions.filter(session => session.state === "running" || session.state === "stopping").length;
	}

	public async loadSessionsFromDatabase() {
		const rawSessions = await this.databaseClient.sessionRepository.getActiveSessions();
		const sessions = await utils.asyncMap(rawSessions, async (rawSession) => {
			const session = new Session(this.provider, rawSession);
			try {
				await session.setup();
				return session;
			} catch(error) {
				try {
					await session.destroy();
					await this.errorHandler.handleSessionError(session, error, "Removed session after it failed to reload.");
				} catch(error) {
					await this.errorHandler.handleSessionError(session, error, "Failed to remove session after it failed to reload.");
				}
				return null;
			}
		});

		for (const session of sessions) {
			if (session) {
				session.onStateChange.addListener(this.handleSesionStateChange.bind(this));
				this.sessions.push(session);
			}
		}

		try {
			await this.updateRunningSessionsCount();
		} catch(error) {
			await this.errorHandler.handleGenericError(error, "Failed to update session count.");
		}
	}

	public async startNewSession(options: {hostUserId: string, blueprint: SessionBlueprint, experienceId?: string}) {
		const newRawSession: RawSession = {
			uniqueId: utils.newId(),
			state: "new",
			blueprint: options.blueprint,
			hostId: options.hostUserId,
			experinceId: options.experienceId,
			id: Session.generateSessionId(),
			playTypes: [],
			players: [],
		}

		const session = new Session(this.provider, newRawSession);
		session.onStateChange.addListener(this.handleSesionStateChange.bind(this));
		this.sessions.push(session);
		try {
			await session.setup();
		} catch (error) {
			this.removeSession(session);
			throw error;
		}
		return session;
	}

	public getSession(id: string) {
		const sessionWithId = this.sessions.find(session => session.id === id || session.uniqueId === id);
		if (!sessionWithId || !sessionWithId.isRunningOrStopping) {
			return null;
		}

		return sessionWithId;
	}

	public getSessionFromChannel(channel: string|Discord.Channel) {
		return this.sessions.find(session => session.isChannelForSession(channel));
	}

	public getJoinedSession(user: string|Discord.User|Discord.GuildMember) {
		const userId = typeof user === "string" ? user : user.id;
		return this.sessions.find(session => session.isRunningOrStopping && session.isUserInSession(userId));
	}

	public getHostedSession(user: string|Discord.User|Discord.GuildMember) {
		const userId = typeof user === "string" ? user : user.id;
		return this.sessions.find(session => session.isRunningOrStopping && session.hostId === userId);
	}

	private async updateRunningSessionsCount() {
		const runningSessions = this.sessions.filter(session => session.state === "running").length;
		if (runningSessions === this.runningSessionsCount) {
			return;
		}

		this.runningSessionsCount = runningSessions;
		const sessionsCountChannel = await this.discordClient.getChannel("sessionsCount");
		if (!sessionsCountChannel || !("setName" in sessionsCountChannel)) {
			return;
		}

		if (runningSessions === 0) {
			sessionsCountChannel.setName(`🔴 no trippy sessions`);
		} else {
			sessionsCountChannel.setName(`🔵 ${runningSessions} trippy session${runningSessions === 1 ? "" : "s"}`);
		}
	}

	private async handleSesionStateChange(session: Session) {
		if (session.state === "ended") {
			this.removeSession(session);
		}

		await this.updateRunningSessionsCount();
	}

	private removeSession(session: Session) {
		const sessionIndex = this.sessions.indexOf(session);
		if (sessionIndex >= 0) {
			this.sessions.splice(sessionIndex, 1);
		}
	}
}