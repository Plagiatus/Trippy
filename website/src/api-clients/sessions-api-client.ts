import Provider from "@/provider/provider";
import BaseApiClient from "./base-api-client";

export default class SessionsApiClient extends BaseApiClient {
	public constructor(provider: Provider) {
		super(provider);
	}

	public async getTemplate(templateId: string) {
		return this.get(`session/setup/${templateId}`);
	}

	public async createTemplateCode(template: SessionSetupData) {
		return this.post(`session/getcode/`, template);
	}
}