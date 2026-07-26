import { UserRecommendationResultDto } from "$/types/dto-types";
import BaseApiClient from "./base-api-client";

export default class RecommendationApiClient extends BaseApiClient {
	public async recommendUser(userId: string) {
		return this.post<UserRecommendationResultDto>(`recommendation/recommend/${encodeURIComponent(userId)}`);
	}
}
