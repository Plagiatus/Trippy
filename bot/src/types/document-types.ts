import { SessionBlueprint } from "./session-blueprint-types";

export type SessionPlayer = {
	id: string;
	joinTime: number;
	leaveTime?: number;
}

export type SessionChannels = {
	categoryId : string;
	mainTextId : string;
	voiceIds : string[];
	hostId : string;
}

export type SessionMessages = {
	informationId: string;
	announcementId: string;
	hostId: string;
}

export type SessionRoles = {
	hostId: string;
	mainId: string;
}

export type RawSession = {
	readonly id: string;
	blueprint: SessionBlueprint;
	hostId: string;
	players: SessionPlayer[];
} & ({
	state: "new",
} | {
	state: "running",
	channels: SessionChannels;
	messages: SessionMessages;
	roles: SessionRoles;
	startTime: number;
} | {
	state: "stopping",
	channels: SessionChannels;
	messages: Omit<SessionMessages, "announcementId">;
	roles: SessionRoles;
	startTime: number;
	endTime: number;
} | {
	state: "ended",
	channels: null;
	messages: null;
	roles: null;
	startTime: number;
	endTime: number;
});

export type SessionTemplate = { readonly code: string; } & SessionBlueprint

export type UserData = {
	readonly id: string;
	discordAuthToken?: string;
}