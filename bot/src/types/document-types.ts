import { SessionBlueprint } from "./session-blueprint-types";

export type SessionPlayer = {
	id: string;
	joinTime: number;
	leaveTime?: number;
}

export type SessionChannels = {
	categoryId : string;
	mainTextId : string;
	hostId : string;
	voiceChannels: SessionVoiceChannelsData;
}

export type SessionMessages = {
	information: SimpleMessageData;
	announcement: SimpleMessageData;
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
	messages: Omit<SessionMessages, "announcement">;
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
	}
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