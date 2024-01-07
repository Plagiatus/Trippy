import Provider from "@/provider/provider";
import BaseApiClient from "./base-api-client";
import { SessionBlueprint } from "@/types/session-blueprint-types";
import { SessionInformationDto, UserSessionsListDto } from "@/types/dto-types";

export default class SessionApiClient extends BaseApiClient {
	public constructor(provider: Provider) {
		super(provider);
	}

	public async createSession(sessionInformation: {blueprint: SessionBlueprint, experienceId?: string}) {
		return this.post<{sessionId: string}>(`session`, sessionInformation);
	};

	public async getUsersSessions() {
		return this.get<UserSessionsListDto>(`session`);
	}

	public async getSessionInformation(sessionId: string) {
		return this.get<SessionInformationDto>(`session/${sessionId}`);
	}

	public async updateSessionBlueprint(sessionId: string, blueprint: SessionBlueprint) {
		return this.post<{}>(`session/${sessionId}`, {blueprint: blueprint})
	}
}