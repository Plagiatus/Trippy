import Provider from "@/provider/provider";
import BaseApiClient from "./base-api-client";
import { ExperienceInformationDto, UserExperiencesListDto } from "@/types/dto-types";
import { SessionBlueprint } from "@/types/session-blueprint-types";

export default class ExperienceApiClient extends BaseApiClient {
	public constructor(provider: Provider) {
		super(provider);
	}

	public getUsersExperiences() {
		return this.get<UserExperiencesListDto>(`experience`);
	}

	public getExperience(experienceId: string) {
		return this.get<ExperienceInformationDto>(`experience/${experienceId}`);
	}

	public async createExperience(blueprint: SessionBlueprint) {
		return this.post<{experienceId: string}>(`experience`, {
			defaultBlueprint: blueprint,
		});
	};

	public async updateExperienceBlueprint(experienceId: string, blueprint: SessionBlueprint) {
		return this.post<{experienceId: string}>(`experience/${experienceId}`, {
			defaultBlueprint: blueprint,
		});
	}
}