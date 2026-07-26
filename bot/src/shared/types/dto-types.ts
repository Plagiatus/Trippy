import { SessionBlueprint, SimplifiedSessionBlueprint } from "./session-blueprint-types"

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

export type UserRecommendationSuccessDto = {
	success: true;
	recommenderUserId: string;
	recommendedUserId: string;
}

export type UserRecommendationCooldownDto = {
	success: false;
	recommenderUserId: string;
	recommendedUserId: string;
	error: "cooldown";
	millisecondsBeforeBeingAbleToRecommendUser: number;
	millisecondsBeforeBeingAbleToRecommendAny: number|null;
}

export type UserRecommendationNotAllowedDto = {
	success: false;
	recommenderUserId: string;
	recommendedUserId: string;
	error: "notAllowed";
}

export type UserRecommendationSelfDto = {
	success: false;
	recommenderUserId: string;
	recommendedUserId: string;
	error: "self";
}

export type UserRecommendationUserNotFoundDto = {
	success: false;
	recommenderUserId: string;
	recommendedUserId: string;
	error: "userNotFound";
}

export type UserRecommendationResultDto =
	| UserRecommendationSuccessDto
	| UserRecommendationCooldownDto
	| UserRecommendationNotAllowedDto
	| UserRecommendationSelfDto
	| UserRecommendationUserNotFoundDto;

export type UnbanActionSuccessDto = {
	success: true;
	hostUserId: string;
	targetUserId: string;
}

export type UnbanActionNotBannedErrorDto = {
	success: false;
	hostUserId: string;
	targetUserId: string;
	error: "not-banned";
}

export type UnbanActionResultDto = UnbanActionSuccessDto | UnbanActionNotBannedErrorDto;

export type BanActionSuccessDto = {
	success: true;
	hostUserId: string;
	targetUserId: string;
}

export type BanActionSelfErrorDto = {
	success: false;
	hostUserId: string;
	targetUserId: string;
	error: "self";
}

export type BanActionAlreadyBannedErrorDto = {
	success: false;
	hostUserId: string;
	targetUserId: string;
	error: "already-banned";
}

export type BanActionResultDto = BanActionAlreadyBannedErrorDto | BanActionSuccessDto | BanActionSelfErrorDto;

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