import Provider from "@/provider/provider";
import BaseApiClient from "./base-api-client";

export default class ImageApiClient extends BaseApiClient {
	public constructor(provider: Provider) {
		super(provider);
	}

	public getImageLink(imageId: string): string;
	public getImageLink(imageId: string|undefined): string|undefined;
	public getImageLink(imageId: string|undefined): string|undefined {
		if (!imageId) {
			return undefined;
		}

		return `${this.config.apiUrl}/image/${imageId}`;
	}
}