import Provider from "../provider";
import { RawSession } from "../types/document-types";
import Repository from "./repository";
import * as Mongo from "mongodb";

export default class SessionRepository extends Repository<RawSession,"uniqueId"> {
	public constructor(provider: Provider, collection: Mongo.Collection<RawSession>) {
		super(provider, collection, "uniqueId");
	}
	
	public async getActiveSessions() {
		return this.removeMongoIdFields(await this.collection.find({ state: {$in: ["running","stopping"]} }).toArray());
	}

	public async getHostedSessions(byUserId: string) {
		return this.removeMongoIdFields(await this.collection.find({hostId: byUserId}).toArray());
	}

	public async getJoinedSessions(byUserId: string) {
		return this.removeMongoIdFields(await this.collection.find({"players": {$elemMatch: {id: byUserId}}}).toArray());
	}
}