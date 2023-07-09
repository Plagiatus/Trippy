import Provider from "@/provider/provider";
import BaseApiClient from "./base-api-client";
import { SessionBlueprint } from "@/types/session-blueprint-types";

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
}