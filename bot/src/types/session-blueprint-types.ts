export type SessionBlueprint = {
	name: string;
	description: string;
	type: SessionType;
	category: SessionCategory;
	edition: MinecraftEdition;
	version: string;
	server: ServerType;
	preferences: SessionPreferences;
	
	rpLink?: string;
	voiceChannels?: VoiceChannelBlueprint[];
	image?: string;
	testDescription?: string;
}

export type SessionPreferences = {
	communication?: Communication;
	newPlayers?: NewPlayers;
	timeEstimate?: number;
	players?: {
		min?: number;
		max?: number;
	}
}

type RealmsType = {
	type: "realms";
	owner?: string;
}

type NormalServerType = {
	type: "server";
	ip: string;
}

export type VoiceChannelBlueprint = {
	name?: string;
}

export type ServerType = RealmsType|NormalServerType;
type MinecraftEdition = "java" | "bedrock";
type SessionType = "testing"|"recording"|"fun"|"stream";
type SessionCategory = "parkour"|"pvp"|"pve"|"puzzle"|"stategy"|"hns"|"ctm"|"multiple"|"other";
type Communication = "none" | "vc_encouraged" | "voice_encouraged" | "vc_required" | "voice_required";
type NewPlayers = "none" | "new" | "exp";