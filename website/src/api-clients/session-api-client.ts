import Provider from "$/provider/provider";
import BaseApiClient from "./base-api-client";
import { SessionBlueprint } from "$/types/session-blueprint-types";
import { SessionInformationDto, UserSessionsListDto } from "$/types/dto-types";

export default class SessionApiClient extends BaseApiClient {
	public constructor(provider: Provider) {
		super(provider);
	}

	public async createSession(sessionInformation: {blueprint: SessionBlueprint, experienceId?: string, image?: Blob}) {
		const formData = new FormData();
		formData.append("blueprint", JSON.stringify(sessionInformation.blueprint));
		if (sessionInformation.experienceId) {
			formData.append("experienceId", sessionInformation.experienceId);
		}
		if (sessionInformation.image) {
			formData.append("image", sessionInformation.image);
		}
		
		return this.post<{sessionId: string, uniqueSessionId: string}>(`session`, formData);
	};

	public async getUsersSessions() {
		return this.get<UserSessionsListDto>(`session`);
	}

	public async getSessionInformation(sessionId: string) {
		return this.get<SessionInformationDto>(`session/${sessionId}`);
	}

	public async updateSessionBlueprint(options: {sessionId: string, blueprint: SessionBlueprint, image?: Blob|null}) {
		const formData = new FormData();
		formData.append("blueprint", JSON.stringify(options.blueprint));
		if (options.image) {
			formData.append("image", options.image);
		} else if (options.image === null) {
			formData.append("removeImage", "true");
		}

		return this.post<{}>(`session/${options.sessionId}`, formData)
	}

	public async getMillisecondsTillBeingAbleToPing() {
		return this.get<{millisecondsTillNextPing: number|null}>("/session/millisecondsTillPing");
	}
}