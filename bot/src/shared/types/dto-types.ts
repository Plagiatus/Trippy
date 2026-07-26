import { SessionBlueprint, SimplifiedSessionBlueprint } from "./session-blueprint-types";

export type SimpleSuccessDto = {
	success: true;
}

export type SimpleErrorDto<TError> = {
	success: false;
	error: TError;
}

export type DiscordUserInformationDto = {
	id: string;
	name: string|undefined;
	avatar: string|undefined;
};

export type SessionPlayerHistoryTypeDto = "normal"|"kicked"|"banned"|"soft-kicked";

export type SessionPlayerHistoryDto = {
	id: string;
	joinTime: number;
	leaveTime?: number;
	type?: SessionPlayerHistoryTypeDto;
	user: DiscordUserInformationDto;
};

export type SessionInformationDto = {
	state: "running"|"stopping"|"ended",
	id: string;
	uniqueId: string;
	users: Array<DiscordUserInformationDto>;
	host: DiscordUserInformationDto;
	hasJoined: boolean;
	startedAt: null|number;
	endedAt: null|number;
	experience: undefined|{
		id: string;
		name: string;
	};
	playerHistory: Array<SessionPlayerHistoryDto>;
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

export type UserRecommendationCooldownDto = {
	success: false;
	error: "cooldown";
	millisecondsBeforeBeingAbleToRecommendUser: number;
	millisecondsBeforeBeingAbleToRecommendAny: number|null;
}

export type UserRecommendationResultDto =
	| SimpleSuccessDto
	| UserRecommendationCooldownDto
	| SimpleErrorDto<"not-allowed">
	| SimpleErrorDto<"self">
	| SimpleErrorDto<"self-not-found">
	| SimpleErrorDto<"user-not-found">;

export type KickResultDto =
	| SimpleSuccessDto
	| SimpleErrorDto<"no-permission">
	| SimpleErrorDto<"self-not-found">
	| SimpleErrorDto<"user-not-found">
	| SimpleErrorDto<"user-not-here">
	| SimpleErrorDto<"session-not-found">;

export type BanActionResultDto =
	| SimpleSuccessDto
	| SimpleErrorDto<"self-not-found">
	| SimpleErrorDto<"user-not-found">
	| SimpleErrorDto<"self">
	| SimpleErrorDto<"already-banned">;

export type UnbanActionResultDto =
	| SimpleSuccessDto
	| SimpleErrorDto<"self-not-found">
	| SimpleErrorDto<"user-not-found">
	| SimpleErrorDto<"not-banned">;

export type BanListDto = {
	bannedUsers: DiscordUserInformationDto[];
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