import { ObjectId, WithId } from "mongodb";
import { UserData } from "../types/document-types";
import Repository from "./repository";
import Provider from "../provider";
import * as Mongo from "mongodb";

export default class UserRepository extends Repository<UserData,"id"> {
	public constructor(provider: Provider, collection: Mongo.Collection<UserData>) {
		super(provider, collection, "id");
	}
	
	public override async get(id: string): Promise<UserData> {
		const data = await super.get(id);
		return data ?? this.getNewUserData(id);
	}

	private getNewUserData(id: string): UserData {
		return {
			id: id,
			discordAuthToken: undefined
		}
	}
}