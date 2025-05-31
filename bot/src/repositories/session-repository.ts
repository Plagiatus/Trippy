import { RawSession } from "../types/document-types";
import Repository from "./repository";
import * as Mongo from "mongodb";

export default class SessionRepository extends Repository<RawSession,"uniqueId"> {
	public constructor(collection: Mongo.Collection<RawSession>) {
		super(collection, "uniqueId");
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

	public async getFirstSessionStartTime() {
		const document = await this.collection.aggregate([
			{
				"$group": {
					"_id": 1,
					"startTime": {"$min": "$startTime"}
				}
			}
		]).next();

		return document?.startTime as number | undefined;
	}

	public async getAmountOfPlayersInSessionsStats(options: {from?: Date, to?: Date, minimumPlayTimeRequired?: number, aggregate?: "day"|"week"|"month"|"year", millisecondIntervals: number}) {
		const documents = await this.collection.aggregate([
			...this.getPlayersInTimeAggregation(options),
			{
				// Add an array which contains all the intervals the user was in the session
				"$set": {
					"inSessionAt": {
						"$range": [
							{"$toInt": {"$divide": ["$joinTime", options.millisecondIntervals]}},
							{"$add": [{"$toInt": {"$divide": ["$leaveTime", options.millisecondIntervals]}}, 1]},
							1
						]
					}
				}
			},
			{
				// "flatten" inSessionAt so there is one document for each "inSessionAt" element
				"$unwind": "$inSessionAt"
			},
			{
				// Multiply inSessionAt up to a datetime
				"$set": {
					"inSessionAt": {"$multiply": ["$inSessionAt", options.millisecondIntervals]}
				}
			},
			...(options.from && options.to ? [{
				// Remove last few values outside of range
				"$match": {
					"$and": [
						{"inSessionAt": {"$gte": options.from.getTime()}},
						{"inSessionAt": {"$lte": options.to.getTime()}},
					]
				}
			}] : []),
			...(options.aggregate ? [{
				// Truncate inSessionAt values
				"$set": {
					"inSessionAt": {
						"$multiply": [
							{
								"$floor": {
									"$divide": [
										{
											"$subtract": [
												{"$toDate": "$inSessionAt"},
												{
													"$dateTrunc": {
														"date": {"$toDate": "$inSessionAt"},
														"unit": options.aggregate,
													}
												}
											]
										},
										options.millisecondIntervals,
									]
								}
							},
							options.millisecondIntervals,
						]
					}
				}
			}] : []),
			{
				// Count the amount of players in each interval by grouping on the interval
				"$group": {
					"_id": "$inSessionAt",
  					"count": {"$count": {}},
				}
			},
			{
				"$sort": {
					"_id": 1,
				}
			}
		]).toArray();

		return documents.map(document => ({
			count: document.count as number,
			dateTime: document._id,
		}));
	}

	public async getAmountOfSessionsStats(options: {from?: Date, to?: Date, minimumRunTimeRequired?: number, aggregate?: "day"|"week"|"month"|"year", millisecondIntervals: number}) {
		const documents = await this.collection.aggregate([
			...this.getSessionsInTimeAggregation(options),
			{
				// Add an array which contains all the intervals the session was going
				"$set": {
					"sessionAt": {
						"$range": [
							{"$toInt": {"$divide": ["$startTime", options.millisecondIntervals]}},
							{"$add": [{"$toInt": {"$divide": ["$endTime", options.millisecondIntervals]}}, 1]},
							1
						]
					}
				}
			},
			{
				// "flatten" sessionAt so there is one document for each "sessionAt" element
				"$unwind": "$sessionAt"
			},
			{
				// Multiply sessionAt up to a datetime
				"$set": {
					"sessionAt": {"$multiply": ["$sessionAt", options.millisecondIntervals]}
				}
			},
			...(options.from && options.to ? [{
				// Remove last few values outside of range
				"$match": {
					"$and": [
						{"sessionAt": {"$gte": options.from.getTime()}},
						{"sessionAt": {"$lte": options.to.getTime()}},
					]
				}
			}] : []),
			...(options.aggregate ? [{
				// Truncate sessionAt values
				"$set": {
					"sessionAt": {
						"$multiply": [
							{
								"$floor": {
									"$divide": [
										{
											"$subtract": [
												{"$toDate": "$sessionAt"},
												{
													"$dateTrunc": {
														"date": {"$toDate": "$sessionAt"},
														"unit": options.aggregate,
													}
												}
											]
										},
										options.millisecondIntervals,
									]
								}
							},
							options.millisecondIntervals,
						]
					}
				}
			}] : []),
			{
				// Count the amount of sessions in each interval by grouping on the interval
				"$group": {
					"_id": "$sessionAt",
  					"count": {"$count": {}},
				}
			},
			{
				"$sort": {
					"_id": 1,
				}
			}
		]).toArray();

		return documents.map(document => ({
			count: document.count as number,
			dateTime: document._id,
		}));
	}

	public async getTotalPlayersInPeriod(options: {from?: Date, to?: Date, minimumPlayTimeRequired?: number, unique?: boolean}) {
		const result = await this.collection.aggregate([
			...this.getPlayersInTimeAggregation(options),
			...(options.unique ? [{
				// Group on player ids / make sure there only is 1 element per user.
				"$group": {
					_id: "$id",
				}
			}] : []),
			{
				"$count": "count"
			}
		]).toArray();

		return result[0]?.count ?? 0;
	}

	public async getTotalHostsInPeriod(options: {from: Date, to: Date, minimumRunTimeRequired?: number, unique?: boolean}) {
		const result = await this.collection.aggregate([
			...this.getSessionsInTimeAggregation(options),
			...(options.unique ? [{
				// Group on host ids / make sure there only is 1 element per host.
				"$group": {
					_id: "$hostId",
				}
			}] : []),
			{
				"$count": "count"
			}
		]).toArray();

		return result[0]?.count ?? 0;
	}

	public async getTotalUniqueExperiencesInPeriod(options: {from: Date, to: Date, minimumRunTimeRequired?: number}) {
		const result = await this.collection.aggregate([
			...this.getSessionsInTimeAggregation(options),
			{
				// Group on experienceId so there is only one per experience.
				// If session doesn't have an experience id then use the session's unique id
				// so the element will be kept.
				"$group": {
					_id: {"$ifNull": ["$experinceId", "$_id"]},
				}
			},
			{
				"$count": "count"
			}
		]).toArray();

		return result[0]?.count ?? 0;
	}

	private getPlayersInTimeAggregation(options: {from?: Date, to?: Date, minimumPlayTimeRequired?: number}): Mongo.Document[] {
		return [
			{
				// "flatten" players so there is 1 document for each "players" element
				"$unwind": "$players"
			},
			{
				// Set root document to the player information
				"$replaceRoot": {
					"newRoot": "$players"
				}
			},
			{
				// Make sure join and leave time is set
				"$match": {
					"joinTime": {"$exists": true},
					"leaveTime": {"$exists": true},
				}
			},
			...(options.from && options.to ? [{
				// Keep values which start / ended in the range
				"$match": {
					"$and": [
						{"joinTime": {"$lte": options.to.getTime()}},
						{"leaveTime": {"$gte": options.from.getTime()}},
					]
				}
			}] : []),
			...(options.minimumPlayTimeRequired ? [{
				// Ignore players who quickly left
				"$match": {
					"$expr": {"$gte": ["$leaveTime", {"$add": ["$joinTime", options.minimumPlayTimeRequired]}]}
				}
			}] : []),
		]
	}

	private getSessionsInTimeAggregation(options: {from?: Date, to?: Date, minimumRunTimeRequired?: number}): Mongo.Document[] {
		return [
			{
				// Make sure start and end time is set
				"$match": {
					"startTime": {"$exists": true},
					"endTime": {"$exists": true},
				}
			},
			...(options.from && options.to ? [{
				// Keep values which start / ended in the range
				"$match": {
					"$and": [
						{"startTime": {"$lte": options.to.getTime()}},
						{"endTime": {"$gte": options.from.getTime()}},
					]
				}
			}] : []),
			...(options.minimumRunTimeRequired ? [{
				// Ignore quickly ended sessions
				"$match": {
					"$expr": {"$gte": ["$endTime", {"$add": ["$startTime", options.minimumRunTimeRequired]}]}
				}
			}] : []),
		]
	}
}