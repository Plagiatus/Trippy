import * as fs from "fs";
import path from "path";
import { validate } from "validate.js";
import utils from "./utils/utils";

export type RawConfig = {
	botToken: string,
	appId: string,
	serverId: string,
	port: number,
	frontendUrl: string,
	db: {
		user: string,
		password: string,
		url: string,
		name: string,
	},
	channels: {
		modLog: string,
		systemLog: string,
		sessionList: string,
		activeSessions: string,
	},
	roles: {
		mods: string,
		hosts: string,
	}
}

export default class Config {
	private static readonly constraints = {
		frontendUrl: { presence: true},
		botToken: { presence: true, length: {minimum: 10}},
		serverId: { presence: true, length: {minimum: 18}},
		appId: { presence: true, length: {minimum: 18}},
		port: { presence: true, numericality: {onlyInteger: true, noStrings: true}},
		// "db.user": { presence: true },
		// "db.password": { presence: true },
		"db.url": { presence: true },
		"db.name": { presence: true },

		"channels.modLog": { presence: true, length: {minimum: 18} },
		"channels.systemLog": { presence: true, length: {minimum: 18} },
		"channels.sessionList": { presence: true, length: {minimum: 18} },
		"channels.activeSessions": { presence: true, length: {minimum: 18} },

		"roles.mods": { presence: true, length: {minimum: 18} },
		"roles.hosts": { presence: true, length: {minimum: 18} },
	};

	public constructor(private readonly rawConfig: RawConfig) {

	}

	public get databaseUrl() {
		if (!this.rawConfig.db.name || !this.rawConfig.db.password) {
			return `mongodb://${this.rawConfig.db.url}`
		}

		return `mongodb://${this.rawConfig.db.user}:${this.rawConfig.db.password}@${this.rawConfig.db.url}`;
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

	public static loadConfigFile(filePath: string) {
		if (!fs.existsSync(filePath)) throw new Error(`Config file not found, looking at "${filePath}".`);
		let fileContent: string = fs.readFileSync(filePath, "utf-8");
		if (!fileContent) throw new Error(`Config file empty.`);
		
		let config: RawConfig = JSON.parse(fileContent);
		let validation = validate(config, Config.constraints);
		if (validation) {
			console.error("\n\x1b[41m Config Validation Error: \x1b[49m\n", validation, "");
			throw new Error("Config validation failed. See above for details.");
		}
		
		return new Config(config);
	}

	public static getEnvironmentConfigPath() {
		return path.join(utils.executionRootPath, `./../config_${process.argv[2] ?? "local"}.json`);
	}
}