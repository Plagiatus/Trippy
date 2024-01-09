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

	public async createExperience(options: {blueprint: SessionBlueprint, image?: Blob}) {
		const formData = new FormData();
		formData.append("defaultBlueprint", JSON.stringify(options.blueprint));
		if (options.image) {
			formData.append("image", options.image);
		}

		return this.post<{experienceId: string}>(`experience`, formData);
	};

	public async updateExperienceBlueprint(options: {experienceId: string, blueprint: SessionBlueprint, image?: Blob|null}) {
		const formData = new FormData();
		formData.append("defaultBlueprint", JSON.stringify(options.blueprint));
		if (options.image) {
			formData.append("image", options.image);
		} else if (options.image === null) {
			formData.append("removeImage", "true");
		}
		
		return this.post<{experienceId: string}>(`experience/${options.experienceId}`, formData);
	}
}