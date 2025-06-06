import { SessionBlueprint } from "../shared/types/session-blueprint-types";

export type RawConfig = Readonly<{
	botToken: string,
	appId: string,
	serverId: string,
	oAuthSecret: string,
	jwtSecret: string,
	port: number,
	frontendUrl: string,
	backendUrl: string,
	db: Readonly<{
		user: string,
		password: string,
		url: string,
		name: string,
	}>,
	legacyDB: Readonly<{
		user: string,
		password: string,
		url: string,
		name: string,
	}>,
	channels: Readonly<{
		modLog: string,
		systemLog: string,
		sessionList: string,
		sessionListNoPing: string,
		placeSessionsRelativeToCategory: string,
		sessionsCount: string,
	}>,
	roles: Readonly<{
		mods: string,
		hosts: string,
		pingRole?: string,
		unlocks: ReadonlyArray<Readonly<{
			roleId: string,
			requiredRecommendation: number,
		}>>;
	}>,
	session: Readonly<{
		endingTime: number,
		checkActivityEveryHours: number,
		minutesToWaitOnActivity: number,
	}>,
	recommendation: Readonly<{
		baseAmountOfScoreToLosePerHour: number,
		scoreLostOnBeingKicked: number,
		scoreLostOnBeingBanned: number,
		recommendationCheckpoints: ReadonlyArray<number>,
		give: Readonly<{
			cooldownHours: number,
			amount: number,
			partialUnlockAt: number,
			fullUnlockAt: number,
			maxGivesPerDayAtPartialUnlock: number,
			maxGivesPerDayAtFullUnlock: number,
		}>,
		playingSession: Readonly<{
			firstGiveOutAfterMinutes: number,
			scorePerMinute: number,
			bonusForJoining: number
		}>,
		hostingSession: Readonly<{
			firstGiveOutAfterMinutes: number,
			scorePerMinuteWithUsers: number,
			bonusForJoining: number
		}>,
		imageUnlockAt: number,
		pingUnlock: Readonly<{
			partialUnlockAt: number,
			fullUnlockAt: number,
			hoursOfDelayAtPartialUnlock: number,
		}>,
		playTypeMultiplier: Readonly<Partial<Record<SessionBlueprint["type"], number>>>
	}>
}>;