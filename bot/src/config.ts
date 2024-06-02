import * as fs from "fs";
import path from "path";
import { validate } from "jsonschema";
import utils from "./utils/utils";
import { RawConfig } from "./types/config";
import JsonSchemasBuilder from "./json-schemas-builder";

export default class Config {
	public readonly sortedRecommendationCheckpoints: ReadonlyArray<number>;

	public constructor(public readonly rawConfig: RawConfig) {
		this.sortedRecommendationCheckpoints = [...rawConfig.recommendation.recommendationCheckpoints].sort((a,b) => b - a);
	}

	public get databaseUrl() {
		if (!this.rawConfig.db.name || !this.rawConfig.db.password) {
			return `mongodb://${this.rawConfig.db.url}`
		}

		return `mongodb+srv://${this.rawConfig.db.user}:${this.rawConfig.db.password}@${this.rawConfig.db.url}`;
	}
	public get databaseLegacyUrl() {
		if (!this.rawConfig.legacyDB.name || !this.rawConfig.legacyDB.password) {
			return `mongodb://${this.rawConfig.legacyDB.url}`
		}

		return `mongodb+srv://${this.rawConfig.legacyDB.user}:${this.rawConfig.legacyDB.password}@${this.rawConfig.legacyDB.url}`;
	}

	public get webServerPort() {
		return this.rawConfig.port;
	}

	public get frontendUrl() {
		return this.rawConfig.frontendUrl;
	}

	public get discordApiToken() {
		return this.rawConfig.botToken;
	}

	public get guildId() {
		return this.rawConfig.serverId;
	}

	public get channelIds(): Readonly<RawConfig["channels"]> {
		return this.rawConfig.channels;
	}

	public get roleIds(): Readonly<RawConfig["roles"]> {
		return this.rawConfig.roles;
	}

	public get discordAppId() {
		return this.rawConfig.appId;
	}

	public get discordOAuthSecret() {
		return this.rawConfig.oAuthSecret;
	}

	public get jwtSecret() {
		return this.rawConfig.jwtSecret;
	}

	public get databaseName() {
		return this.rawConfig.db.name;
	}
	public get databaseLegacyName() {
		return this.rawConfig.legacyDB.name;
	}

	public get sessionEndingTime() {
		return this.rawConfig.session.endingTime;
	}

	public get sessionCheckActivityMillisecondsInterval() {
		return this.rawConfig.session.checkActivityEveryHours * 60 * 60 * 1000;
	}

	public get sessionMillisecondsToWaitOnActivity() {
		return this.rawConfig.session.minutesToWaitOnActivity * 60 * 1000;
	}

	public static loadConfigFile(filePath: string) {
		if (!fs.existsSync(filePath)) throw new Error(`Config file not found, looking at "${filePath}".`);
		const fileContent: string = fs.readFileSync(filePath, "utf-8");
		if (!fileContent) throw new Error(`Config file empty.`);
		
		const config: RawConfig = JSON.parse(fileContent);
		const validationResult = validate(config, new JsonSchemasBuilder().buildConfigSchema());
		if (!validationResult.valid) {
			console.error("\n\x1b[41m Config Validation Error: \x1b[49m\n", validationResult.errors, "");
			throw new Error("Config validation failed. See above for details.");
		}
		
		return new Config(config);
	}

	public static getEnvironmentConfigPath() {
		return path.join(utils.executionRootPath, `./../config_${process.argv[2] ?? "local"}.json`);
	}
}
