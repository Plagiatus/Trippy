import type { Schema } from "jsonschema";

// https://json-schema.org/understanding-json-schema/reference/

const sessionBlueprintSchema: Schema = {
	type: "object",
	required: ["name", "description", "type", "category", "edition", "version", "server", "preferences"],
	additionalProperties: false,
	properties: {
		name: { type: "string", minLength: 1 },
		description: { type: "string", minLength: 1 },
		type: { enum: ["test", "record", "fun", "stream"] },
		category: { enum: ["parkour", "pvp", "pve", "puzzle", "stategy", "hns", "ctm", "multiple", "other"] },
		edition: { enum: ["java", "bedrock", "other"] },
		version: { type: "string" },
		server: {
			oneOf: [
				{
					type: "object",
					additionalProperties: false,
					required: ["type", "ip"],
					properties: {
						type: { const: "server" },
						ip: { type: "string", pattern: "((^([a-zA-Z0-9]([a-zA-Z0-9\\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,8})|(((^|\\.)((25[0-5])|(2[0-4]\\d)|(1\\d\\d)|([1-9]?\\d))){4}))(:((6553[0-5])|(655[0-2][0-9])|(65[0-4][0-9]{2})|(6[0-4][0-9]{3})|([1-5][0-9]{4})|([0-5]{0,5})|([0-9]{1,4})))?$" }
					}
				},
				{
					type: "object",
					additionalProperties: false,
					required: ["type"],
					properties: {
						type: { const: "realms" },
						owner: { type: "string" },
					}
				}
			]
		},
		preferences: {
			type: "object",
			additionalProperties: false,
			properties: {
				communication: { enum: ["none", "vc_encouraged", "voice_encouraged", "vc_required", "voice_required"] },
				newPlayers: { enum: ["none", "new", "exp"] },
				timeEstimate: { type: "number", minimum: 0 },
				players: {
					type: "object",
					additionalProperties: false,
					properties: {
						min: { type: "integer", minimum: 0 },
						max: { type: "integer", minimum: 1 }
					}
				}
			}
		},
		rpLink: { type: "string", pattern: "^(.+:\\/\\/)?([^.]+\\.)+[^.]+(\\/.)?" },
		voiceChannels: {
			type: "array",
			items: {
				type: "object",
				additionalProperties: false,
				properties: {
					name: { type: "string", minLength: 1, maxLength: 16 }
				}
			}
		},
		imageId: { oneOf: [{type: "string"}, {type: "null"}] },
		ping: {type: "boolean"},
	}
}

const configSchema: Schema = {
	type: "object",
	required: ["frontendUrl","botToken","serverId","appId","port","db","channels","roles","session","recommendation"],
	properties: {
		frontendUrl: {type: "string"},
		backendUrl: {type: "string"},
		botToken: {type: "string", minLength: 10},
		serverId: {type: "string", minLength: 18},
		appId: {type: "string", minLength: 18},
		oAuthSecret: {type: "string", minLength: 30},
		jwtSecret: {type: "string", minLength: 16},
		port: {type: "integer", minimum: 0, maximum: 65535},
		db: {
			type: "object",
			required: ["url","name"],
			properties: {
				url: { type: "string" },
				name: { type: "string" },
			}
		},
		channels: {
			type: "object",
			required: ["modLog","systemLog","sessionList","activeSessions"],
			properties: {
				modLog: {type: "string", minLength: 18},
				systemLog: {type: "string", minLength: 18},
				sessionlist: {type: "string", minLength: 18},
				activeSessions: {type: "string", minLength: 18},
			}
		},
		roles: {
			type: "object",
			required: ["mods","hosts"],
			properties: {
				mods: {type: "string", minLength: 18},
				hosts: {type: "string", minLength: 18},
			}
		},
		session: {
			type: "object",
			required: ["endingTime"],
			properties: {
				endingTime: {
					type: "number",
				}
			}
		},
		recommendation: {
			type: "object",
			required: ["baseAmountOfScoreToLosePerHour","imageUnlockAt","pingUnlock"],
			properties: {
				baseAmountOfScoreToLosePerHour: {type: "number", minimum: 0},
				imageUnlockAt: {type: "number", minimum: 0},
				pingUnlock: {
					type: "object",
					required: ["partialUnlockAt","fullUnlockAt","hoursOfDelayAtPartialUnlock"],
					properties: {
						partialUnlockAt: {type: "number", minimum: 0},
						fullUnlockAt: {type: "number", minimum: 0},
						hoursOfDelayAtPartialUnlock: {type: "number", minimum: 0},
					}
				}
			}
		}
	}
}

const jsonSchemas = {
	sessionBlueprintSchema,
	configSchema,
}
export default jsonSchemas;