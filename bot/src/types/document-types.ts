import { SessionBlueprint } from "./session-blueprint-types";

export type SessionPlayer = {
	id: string;
	joinTime: number;
	leaveTime: number;
}

export type SessionChannels = {
	category : string;
	textChannels : string[];
	voiceChannels : string[];
	hostChannel : string;
}

export type Session = {
	readonly id: string;
	blueprint: SessionBlueprint;
	host: string;
	players: SessionPlayer[];
	startTime: number;
	endTime: number;
	channels: SessionChannels;
	announcementMessage: string;
	feedbackId: string;
}

export type SessionTemplate = { readonly code: string; } & SessionBlueprint