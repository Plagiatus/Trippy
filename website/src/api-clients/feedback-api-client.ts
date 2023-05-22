import Provider from "@/provider/provider";
import BaseApiClient from "./base-api-client";

export default class FeedbackApiClient extends BaseApiClient {
	public constructor(provider: Provider) {
		super(provider);
	}

	public async getFeedbackForUUID(uuid: string) {
		return this.get(`feedback/${uuid}`);
	}
}