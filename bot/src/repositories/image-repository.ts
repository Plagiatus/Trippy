import { ImageData } from "../types/document-types";
import utils from "../utils/utils";
import Repository from "./repository";
import * as Mongo from "mongodb";
import TimeHelper from "../time-helper";
import injectDependency from "../shared/dependency-provider/inject-dependency";

export default class ImageRepository extends Repository<ImageData,"id"> {
	private readonly timeHelper = injectDependency(TimeHelper);

	public constructor(collection: Mongo.Collection<ImageData>) {
		super(collection, "id");
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