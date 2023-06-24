export type RawConfigType = {
	apiUrl: string;
	discordOAuthClientId: string;
}

export default class Config {
	public constructor(private readonly rawConfig: RawConfigType) {

	}

	public get apiUrl() {
		return this.rawConfig.apiUrl;
	}

	public get discordOAuthClientId() {
		return this.rawConfig.discordOAuthClientId;
	}
}