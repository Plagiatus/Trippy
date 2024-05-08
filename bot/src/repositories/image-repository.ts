import Provider from "../shared/provider/provider";
import { ImageData } from "../types/document-types";
import utils from "../utils/utils";
import Repository from "./repository";
import * as Mongo from "mongodb";
import TimeHelper from "../time-helper";

export default class ImageRepository extends Repository<ImageData,"id"> {
	private readonly timeHelper: TimeHelper;

	public constructor(provider: Provider, collection: Mongo.Collection<ImageData>) {
		super(provider, collection, "id");
		this.timeHelper = provider.get(TimeHelper);
	}
	
	public async addImage(image: Express.Multer.File): Promise<string> {
		const imageId = utils.newId();

		await this.add({
			id: imageId,
			imageData: new Mongo.Binary(image.buffer),
			createdAt: this.timeHelper.currentDate,
		})

		return imageId;
	}
}