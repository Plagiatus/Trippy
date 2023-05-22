import Provider from "@/provider/provider";
import BaseApiClient from "./base-api-client";

export default class SessionsApiClient extends BaseApiClient {
	public constructor(provider: Provider) {
		super(provider);
	}

	getTemplate(templateId: string) {
		return this.get(`session/setup/${templateId}`);
	}

	createTemplateCode(template: SessionSetupData) {
		return this.post(`session/getcode/`, template);
	}
}