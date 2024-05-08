import { SessionType } from "$/types/session-blueprint-types";
import BaseApiClient from "./base-api-client";

export default class SettingsApiClient extends BaseApiClient {
	public getPlayTypeMultipliers() {
		return this.get<Partial<Record<SessionType,number>>>("settings/play-type-multipliers");
	}
}