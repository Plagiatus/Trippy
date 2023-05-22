import type Provider from "./provider";

interface SessionSetupData {
	name: string
	description: string
	type: string
	edition: string
	version: string
	ip: string
	rpLink: string
	playerAmt: number
	vcAmount: number
	image: string
	mode: string
	preferences: Preferences
	testDescription: string
}

interface iSession extends SessionSetupData {
	readonly id: string
	host: string
	players: SessionPlayer[]
	startTime: number
	endTime: number
	channels: SessionChannels
	announcementMessage: string
	feedbackId: string
}

interface SessionBlueprint extends SessionSetupData {
	code: string
}


interface SessionPlayer {
	id: string
	joinTime: number
	leaveTime: number
}

interface SessionChannels {
	category : string
	textChannels : string[]
	voiceChannels : string[]
	hostChannel : string
}

interface Preferences {
	communication: Communication
	newPlayers: NewPlayers
	timeEstimate: number
}

type Communication = "none" | "vc_encouraged" | "vc_required";
type NewPlayers = "none" | "new" | "exp";