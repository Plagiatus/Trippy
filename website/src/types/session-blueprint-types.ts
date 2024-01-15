export type SessionBlueprint = {
	name: string;
	description: string;
	type: SessionType;
	category: SessionCategory;
	edition: MinecraftEdition;
	version: string;
	server: ServerType;
	preferences: SessionPreferences;
	voiceChannels: VoiceChannelBlueprint[];
	
	rpLink?: string;
	imageId?: string;
	ping?: boolean;
}

export type SessionPreferences = {
	communication?: Communication;
	newPlayers?: NewPlayers;
	timeEstimate?: number;
	players: {
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
type MinecraftEdition = "java" | "bedrock" | "other";
type SessionType = "test"|"record"|"fun"|"stream";
type SessionCategory = "parkour"|"pvp"|"pve"|"puzzle"|"stategy"|"hns"|"ctm"|"multiple"|"other"|"adventure"|"survival"|"horror"|"sandbox"|"creation"|"tabletop"|"race";
type Communication = "none" | "vc_encouraged" | "voice_encouraged" | "vc_required" | "voice_required";
type NewPlayers = "none" | "new" | "exp";

export type PartialSessionBlueprint = Partial<SessionBlueprint>&{
	preferences: Partial<SessionPreferences>&{players: { min?: number, max?: number }};
	voiceChannels: VoiceChannelBlueprint[];
}