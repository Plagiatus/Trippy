import { RecommendationData, UserData, UserLegacyData } from "../types/document-types";
import Repository from "./repository";
import * as Mongo from "mongodb";

export default class UserLegacyRepository extends Repository<UserLegacyData, "id"> {
	public constructor(collection: Mongo.Collection<UserLegacyData>) {
		super(collection, "id");
	}

	public override async get(discordID: string): Promise<UserLegacyData | null> {
		const data = await this.collection.findOne({ discordID });
		return this.removeMongoIdField(data);
	}

	public async getAll(): Promise<UserLegacyData[]> {
		return this.collection.find().toArray();
	}
}