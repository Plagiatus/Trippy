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
	id: number
	host: string
	players: SessionPlayer[]
	startTime: number
	endTime: number
	channels: SessionChannels
	announcementMessage: string
	feedbackId: string
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

interface JavaVersion {
	label: string,
	versions: string[]
}