import Provider from "../provider";
import { ImageData } from "../types/document-types";
import utils from "../utils/utils";
import Repository from "./repository";
import Config from "./../config";
import * as Mongo from "mongodb";

export default class ImageRepository extends Repository<ImageData,"id"> {
	private readonly config: Config;

	public constructor(provider: Provider, collection: Mongo.Collection<ImageData>) {
		super(provider, collection, "id");
		this.config = provider.get(Config);
	}
	
	public async addImage(image: Express.Multer.File): Promise<string> {
		const imageId = utils.newId();

		await this.add({
			id: imageId,
			imageData: new Mongo.Binary(image.buffer),
			createdAt: new Date(),
		})

		return imageId;
	}

	public getImageUrl(imageId: string|ImageData) {
		return this.config.backendUrl + "/image/" + this.getId(imageId);
	}
}