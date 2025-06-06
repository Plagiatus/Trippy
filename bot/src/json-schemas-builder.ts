import { Schema } from "jsonschema";
import TagsHelper from "./shared/tags-helper";
import injectDependency from "./shared/dependency-provider/inject-dependency";

export default class JsonSchemasBuilder {
	private readonly tagsHelper = injectDependency(TagsHelper, {reference: true});

	public buildBlueprintSchema(): Schema {
		return {
			type: "object",
			required: ["name", "description", "type", "tags", "edition", "server", "preferences"],
			additionalProperties: false,
			properties: {
				name: { type: "string", minLength: 1 },
				description: { type: "string", minLength: 1 },
				type: { enum: ["test", "record", "fun", "stream"] },
				tags: {
					type: "array",
					items: {
						enum: this.tagsHelper.value.getAllTags().map(tag => tag.id)
					},
					minLength: 1,
				},
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
								ip: { type: "string", pattern: "((^([a-zA-Z0-9]([a-zA-Z0-9_\\-]{0,61}[a-zA-Z0-9])?\\.)+[a-zA-Z]{2,8})|(((^|\\.)((25[0-5])|(2[0-4]\\d)|(1\\d\\d)|([1-9]?\\d))){4}))(:((6553[0-5])|(655[0-2][0-9])|(65[0-4][0-9]{2})|(6[0-4][0-9]{3})|([1-5][0-9]{4})|([0-5]{0,5})|([0-9]{1,4})))?$" }
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
					maxItems: 8,
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
	}

	public buildConfigSchema(): Schema {
		return {
			type: "object",
			required: ["frontendUrl","botToken","serverId","appId","port","db","legacyDB","channels","roles","session","recommendation"],
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
				legacyDB: {
					type: "object",
					required: ["url","name"],
					properties: {
						url: { type: "string" },
						name: { type: "string" },
					}
				},
				channels: {
					type: "object",
					required: ["modLog","systemLog","sessionList","sessionListNoPing","placeSessionsRelativeToCategory","sessionsCount"],
					properties: {
						modLog: {type: "string", minLength: 18},
						systemLog: {type: "string", minLength: 18},
						sessionlist: {type: "string", minLength: 18},
						sessionListNoPing: {type: "string", minLength: 18},
						placeSessionsRelativeToCategory: {type: "string", minLength: 18},
						sessionsCount: {type: "string", minLength: 18},
					}
				},
				roles: {
					type: "object",
					required: ["mods","hosts","unlocks"],
					properties: {
						mods: {type: "string", minLength: 18},
						hosts: {type: "string", minLength: 18},
						pingRole: {type: "string", minLength: 18},
						unlocks: {
							type: "array",
							items: {
								type: "object",
								required:["roleId","requiredRecommendation"],
								properties: {
									roleId: {type: "string", minLength: 18},
									requiredRecommendation: {type: "number"},
								}
							}
						}
					}
				},
				session: {
					type: "object",
					required: ["endingTime","checkActivityEveryHours","minutesToWaitOnActivity"],
					properties: {
						endingTime: { type: "number"},
						checkActivityEveryHours: { type: "number" },
						minutesToWaitOnActivity: { type: "number" },
					}
				},
				recommendation: {
					type: "object",
					required: ["baseAmountOfScoreToLosePerHour","scoreLostOnBeingKicked","scoreLostOnBeingBanned","recommendationCheckpoints","give","playingSession","hostingSession","imageUnlockAt","pingUnlock","playTypeMultiplier"],
					properties: {
						baseAmountOfScoreToLosePerHour: {type: "number", minimum: 0},
						scoreLostOnBeingKicked: {type: "number", minimum: 0},
						scoreLostOnBeingBanned: {type: "number", minimum: 0},
						recommendationCheckpoints: {
							type: "array",
							items: {type: "number", minimum: 0}
						},
						give: {
							type: "object",
							required: ["cooldownHours","amount"],
							properties: {
								cooldownHours: {type: "number", minimum: 0},
								amount: {type: "number", minimum: 0},
								partialUnlockAt: {type: "number", minimum: 0},
								fullUnlockAt: {type: "number", minimum: 0},
								maxGivesPerDayAtPartialUnlock: {type: "number", minimum: 0},
								maxGivesPerDayAtFullUnlock: {type: "number", minimum: 0},
							}
						},
						playingSession: {
							type: "object",
							required: ["firstGiveOutAfterMinutes","scorePerMinute","bonusForJoining"],
							properties: {
								firstGiveOutAfterMinutes: {type: "number", minimum: 0},
								scorePerMinute: {type: "number", minimum: 0},
								bonusForJoining: {type: "number", minimum: 0},
							}
						},
						hostingSession: {
							type: "object",
							required: ["firstGiveOutAfterMinutes","scorePerMinuteWithUsers","bonusForJoining"],
							properties: {
								firstGiveOutAfterMinutes: {type: "number", minimum: 0},
								scorePerMinuteWithUsers: {type: "number", minimum: 0},
								bonusForJoining: {type: "number", minimum: 0},
							}
						},
						imageUnlockAt: {type: "number", minimum: 0},
						pingUnlock: {
							type: "object",
							required: ["partialUnlockAt","fullUnlockAt","hoursOfDelayAtPartialUnlock"],
							properties: {
								partialUnlockAt: {type: "number", minimum: 0},
								fullUnlockAt: {type: "number", minimum: 0},
								hoursOfDelayAtPartialUnlock: {type: "number", minimum: 0},
							}
						},
						playTypeMultiplier: {
							type: "object",
							properties: {
								test: {type: "number", minimum: 0},
								record: {type: "number", minimum: 0},
								fun: {type: "number", minimum: 0},
								stream: {type: "number", minimum: 0},
							}
						}
					}
				}
			}
		}
	}
}