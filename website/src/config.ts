export type RawConfigType = {
	apiUrl: string;
}

export default class Config {
	public constructor(private readonly rawConfig: RawConfigType) {

	}

	public get apiUrl() {
		return this.rawConfig.apiUrl;
	}
}