import type { Schema } from "jsonschema";

// https://json-schema.org/understanding-json-schema/reference/

const sessionBlueprintSchema: Schema = {
	type: "object",
	required: ["name", "description", "type", "category", "edition", "version", "server", "preferences"],
	additionalProperties: false,
	properties: {
		name: { type: "string", minLength: 1 },
		description: { type: "string" },
		type: { enum: ["testing", "recording", "fun", "stream"] },
		category: { enum: ["parkour", "pvp", "pve", "puzzle", "stategy", "hns", "ctm", "multiple", "other"] },
		edition: { enum: ["java", "bedrock"] },
		version: { type: "string" },
		server: {
			oneOf: [
				{
					type: "object",
					additionalProperties: false,
					required: ["type", "ip"],
					properties: {
						type: { const: "server" },
						ip: { type: "string" }
					}
				},
				{
					type: "object",
					additionalProperties: false,
					required: ["type"],
					properties: {
						type: { const: "realms" },
						owner: { type: "string", minLength: 1 },
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
				timeEstimate: { type: "integer", minimum: 0 },
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
		rpLink: { type: "string", minLength: 1 },
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
		image: { type: "string", pattern: "^(.+:\\/\\/)?([^.]+\\.)+[^.]+(\\/.)?$" },
		testDescription: { type: "string" },
	}
}

const configSchema: Schema = {
	type: "object",
	required: ["frontendUrl","botToken","serverId","appId","port","db","channels","roles"],
	properties: {
		frontendUrl: {type: "string"},
		botToken: {type: "string", minLength: 10},
		serverId: {type: "string", minLength: 18},
		appId: {type: "string", minLength: 18},
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
		}
	}
}

const jsonSchemas = {
	sessionBlueprintSchema,
	configSchema,
}
export default jsonSchemas;