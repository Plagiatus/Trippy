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

export type NewSession = {
	readonly id: string;
	state: "new";
	blueprint: SessionBlueprint;
	hostId: string;
	players: SessionPlayer[];
}

export type RunningSession = {
	readonly id: string;
	state: "running";
	blueprint: SessionBlueprint;
	hostId: string;
	players: SessionPlayer[];
	startTime: number;
	channels: SessionChannels;
	messages: SessionMessages;
	roles: SessionRoles;
}

export type StoppingSession = {
	readonly id: string;
	state: "stopping";
	blueprint: SessionBlueprint;
	hostId: string;
	players: SessionPlayer[];
	startTime: number;
	endTime: number;
	channels: SessionChannels;
	messages: Omit<SessionMessages, "announcement">;
	roles: SessionRoles;
}

export type EndedSession = {
	readonly id: string;
	state: "ended";
	blueprint: SessionBlueprint;
	hostId: string;
	players: SessionPlayer[];
	startTime: number;
	endTime: number;
}

export type RawSession = NewSession|RunningSession|StoppingSession|EndedSession;

export type SessionTemplate = { readonly code: string; } & SessionBlueprint

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