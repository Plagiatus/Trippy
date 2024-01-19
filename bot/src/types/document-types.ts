import { Binary } from "mongodb";
import { SessionBlueprint } from "./session-blueprint-types";

export type SessionPlayer = {
	id: string;
	joinTime: number;
	leaveTime?: number;
	type?: "normal"|"kicked"|"banned";
}

export type SessionPlayType = {
	type: SessionBlueprint["type"];
	from: Date;
}

export type SessionChannels = {
	categoryId : string;
	mainTextId : string;
	hostId : string;
	voiceChannels: SessionVoiceChannelsData;
}

export type SessionMessages = {
	information: SimpleMessageData;
	announcements: SimpleMessageData[];
	host: SimpleMessageData;
}

export type SessionRoles = {
	hostId: string;
	mainId: string;
}

export type BaseSession = {
	readonly uniqueId: string;
	readonly id: string;
	experinceId?: string;
	blueprint: SessionBlueprint;
	hostId: string;
	players: SessionPlayer[];
	playTypes: Array<SessionPlayType>;
}

export type NewSession = BaseSession&{
	state: "new";
}

export type RunningSession = BaseSession&{
	state: "running";
	startTime: number;
	channels: SessionChannels;
	messages: SessionMessages;
	roles: SessionRoles;
}

export type StoppingSession = BaseSession&{
	state: "stopping";
	startTime: number;
	endTime: number;
	channels: SessionChannels;
	messages: Omit<SessionMessages, "announcements">;
	roles: SessionRoles;
}

export type EndedSession = BaseSession&{
	state: "ended";
	startTime: number;
	endTime: number;
}

export type RawSession = NewSession|RunningSession|StoppingSession|EndedSession;

export type UserData = {
	readonly id: string;
	discordAuthToken?: string;
	loginId: number;
	javaAccount?: {
		username: string;
		validated: boolean;
	},
	bedrockAccount?: {
		username: string;
		validated: boolean;
	},
	totalRecommendationScore: number;
	recommendationScore: number;
	lastRecommendationScoreUpdate: Date;
	lastPingAt?: Date;
	givenRecommendations: Array<RecommendationData>;
}

export type RecommendationData = {
	userId: string;
	recommendedAt: Date;
}

export type BanData = {
	readonly userId: string;
	bannedUsers: string[];
}

export type SimpleMessageData = {
	messageId: string;
	channelId: string;
}

export type SessionVoiceChannelsData = {
	categoryChannelId: string;
	channelIds: string[],
}

export type ExperienceData = {
	readonly id: string;
	defaultBlueprint: SessionBlueprint;
	owners: ExperienceOwnershipData[];
}

export type ExperienceOwnershipData = {
	userId: string;
}

export type ImageData = {
	readonly id: string;
	imageData: Binary;
	createdAt: Date;
}