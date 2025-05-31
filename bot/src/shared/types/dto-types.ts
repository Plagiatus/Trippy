import { SessionBlueprint, SimplifiedSessionBlueprint } from "./session-blueprint-types"

export type DiscordUserInformationDto = {
	id: string;
	name: string|undefined;
	avatar: string|undefined;
};

export type SessionInformationDto = {
	state: "running"|"stopping"|"ended",
	id: string;
	uniqueId: string;
	users: Array<DiscordUserInformationDto>;
	host: DiscordUserInformationDto;
	hasJoined: boolean;
	startedAt: null|number;
	experience: undefined|{
		id: string;
		name: string;
	};
}&({isHost: false, blueprint: SimplifiedSessionBlueprint}|{isHost: true, blueprint: SessionBlueprint});

export type SimplifiedSessionInformationDto = {
	uniqueId: string;
	id: string;
	name: string;
	imageId: string|undefined;
};

export type UserSessionsListDto = {
	hostingSession: SimplifiedSessionInformationDto|undefined,
	inSession: SimplifiedSessionInformationDto|undefined,
	latestHostedSessions: Array<SimplifiedSessionInformationDto>,
	latestJoinedSessions: Array<SimplifiedSessionInformationDto>,
}

export type SimplfiedExperienceInformationDto = {
	id: string;
	name: string;
	imageId: string|undefined;
}

export type UserExperiencesListDto = {
	experiences: Array<SimplfiedExperienceInformationDto>;
}

export type ExperienceInformationDto = {
	owners: Array<DiscordUserInformationDto>;
	id: string;
}&({ownsExperience: false, defaultBlueprint: SimplifiedSessionBlueprint}|{ownsExperience: true, defaultBlueprint: SessionBlueprint});

export type TokenAndRefreshInformationDto = {
	jwt: string;
	refreshToken: string;
	expiresIn: number;
}

export type CountAtTimeIntervalDto = {
	count: number;
	dateTime: number;
}

export type PeriodSessionStatsDto = {
	players: CountAtTimeIntervalDto[];
	sessions: CountAtTimeIntervalDto[];
	aggregatedPlayers?: CountAtTimeIntervalDto[];
	aggregatedSessions?: CountAtTimeIntervalDto[];
	totalJoins: number;
	totalUniqueJoins: number;
	totalSessions: number;
	totalUniqueHosts: number;
	totalUniqueExperiences: number;
	start: number;
	end: number;
	aggreatedStart: number;
	aggregatedEnd: number;
	intervals: number;
}

export type PeriodSessionStatsTypeDto = "day"|"week"|"month"|"year"|"all";