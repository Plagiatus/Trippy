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
	channels: Readonly<{
		modLog: string,
		systemLog: string,
		sessionList: string,
		activeSessions: string,
	}>,
	roles: Readonly<{
		mods: string,
		hosts: string,
	}>,
	session: Readonly<{
		endingTime: number,
	}>,
	recommendation: Readonly<{
		baseAmountOfScoreToLosePerHour: number,
		imageUnlockAt: number,
		pingUnlock: Readonly<{
			partialUnlockAt: number,
			fullUnlockAt: number,
			hoursOfDelayAtPartialUnlock: number,
		}>
	}>
}>;