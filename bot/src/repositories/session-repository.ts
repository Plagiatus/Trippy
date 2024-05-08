import Provider from "../shared/provider/provider";
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

	public async getAmountOfHostedSessions(byUserId: string) {
		return await this.collection.countDocuments({hostId: byUserId});
	}

	public async getAmountOfJoinedSessions(userId: string) {
		return await this.collection.countDocuments({"players": {$elemMatch: {id: userId}}});
	}

	public async getLatestHostedSessions(byUserId: string, max: number) {
		return await this.collection.find({hostId: byUserId, state: "ended"})
			.sort("endTime", -1)
			.limit(max)
			.toArray();
	}

	public async getLatestJoinedSessions(userId: string, max: number) {
		return await this.collection.find({"players": {$elemMatch: {id: userId}}, state: "ended"})
			.sort("endTime", -1)
			.limit(max)
			.toArray();
	}
}