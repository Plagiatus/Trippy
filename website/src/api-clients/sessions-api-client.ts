import Provider from "@/provider/provider";
import BaseApiClient from "./base-api-client";
import { SessionBlueprint } from "@/types/session-blueprint-types";
import { SessionInformationDto, UserSessionsListDto } from "@/types/dto-types";

export default class SessionsApiClient extends BaseApiClient {
	public constructor(provider: Provider) {
		super(provider);
	}

	public async createSession(template: SessionBlueprint) {
		return this.post<{sessionId: string}>(`session`, template);
	};

	public async getTemplateByCode(code: string) {
		return this.get<SessionBlueprint>(`session/template/${code}`);
	}

	public async createTemplateCode(template: SessionBlueprint) {
		return this.post<{code: string}>(`session/template/`, template);
	}

	public async getUsersSessions() {
		return this.get<UserSessionsListDto>(`session`);
	}

	public async getSessionInformation(sessionId: string) {
		return this.get<SessionInformationDto>(`session/${sessionId}`);
	}

	public async updateSessionBlueprint(sessionId: string, blueprint: SessionBlueprint) {
		return this.post<{}>(`session/${sessionId}`, blueprint)
	}
}