import Provider from "../provider";
import { RawSession } from "../types/document-types";
import Repository from "./repository";
import * as Mongo from "mongodb";

export default class SessionRepository extends Repository<RawSession,"id"> {
	public constructor(provider: Provider, collection: Mongo.Collection<RawSession>) {
		super(provider, collection, "id");
	}
	
	public getActiveSessions() {
		return this.collection.find({ state: {$in: ["running","stopping"]} }).toArray();
	}
}