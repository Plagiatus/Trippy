import Provider from "../provider";
import { ExperienceData } from "../types/document-types";
import Repository from "./repository";
import * as Mongo from "mongodb";

export default class ExperienceRepository extends Repository<ExperienceData,"id"> {
	public constructor(provider: Provider, collection: Mongo.Collection<ExperienceData>) {
		super(provider, collection, "id");
	}

	public async getOwnedByUser(userId: string) {
		return this.removeMongoIdFields(await this.collection.find({"owners.userId": userId}).toArray());
	}

	public async isOwnedByUser(experienceId: string, userId: string) {
		const experience = await this.get(experienceId);
		return !!experience?.owners.some(owner => owner.userId === userId);
	}
}