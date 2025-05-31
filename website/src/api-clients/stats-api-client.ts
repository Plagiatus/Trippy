import { PeriodSessionStatsDto, PeriodSessionStatsTypeDto } from "$/types/dto-types";
import BaseApiClient from "./base-api-client";

export default class StatsApiClient extends BaseApiClient {
	public getSessionStats(type: PeriodSessionStatsTypeDto) {
		return this.get<PeriodSessionStatsDto>(`stats/session/${type}`);
	}
}