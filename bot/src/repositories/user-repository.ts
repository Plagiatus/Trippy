import { RecommendationData, UserData } from "../types/document-types";
import Repository from "./repository";
import Provider from "../provider";
import * as Mongo from "mongodb";
import TimeHelper from "../time-helper";

export default class UserRepository extends Repository<UserData,"id"> {
	private readonly timeHelper: TimeHelper;

	public constructor(provider: Provider, collection: Mongo.Collection<UserData>) {
		super(provider, collection, "id");
		this.timeHelper = provider.get(TimeHelper);
	}
	
	public override async get(id: string): Promise<UserData> {
		const data = await super.get(id);
		if (data) {
			return {
				...this.getNewUserData(id),
				...data,
			}
		}

		return this.getNewUserData(id);
	}

	public override async update(document: UserData) {
		return await this.collection.replaceOne(this.getQueryForDocument(document), document, {upsert: true});
	}

	public async updateLastPingTime(id: string) {
		await this.collection.updateOne(this.getQueryForDocument(id), {
			$set: {
				lastPingAt: this.timeHelper.currentDate,
			}
		}, {upsert: true});
	}

	public async updateRecommendationScore(document: UserData) {
		await this.collection.updateOne(this.getQueryForDocument(document), {
			$set: {
				recommendationScore: document.recommendationScore,
				lastRecommendationScoreUpdate: document.lastRecommendationScoreUpdate,
				totalRecommendationScore: document.totalRecommendationScore,
			}
		}, {upsert: true});
	}

	public async getLastRecommendationForUser(recommender: UserData|string, recommended: string) {
		const recommenderId = this.getId(recommender);
		const newestRecommendation = await this.collection.aggregate([
			{
				"$match": {
					"id": recommenderId, 
				}
			},
			{
				"$unwind": "$givenRecommendations"
			},
			{
				"$replaceRoot": {
					"newRoot": "$givenRecommendations"
				}
			},
			{
				"$match": {
					"userId": recommended,
				}
			},
			{
				"$sort": {
					"recommendedAt": -1,
				}
			}
		]).next();
		return newestRecommendation as RecommendationData|null;
	}

	public async addGivenRecommendation(recommenderId: string, recommendedId: string) {
		await this.collection.updateOne(this.getQueryForDocument(recommenderId), {
			"$push": {
				"givenRecommendations": {
					userId: recommendedId,
					recommendedAt: this.timeHelper.currentDate
				} satisfies RecommendationData
			}
		}, {upsert: true})
	}

	private getNewUserData(id: string): UserData {
		return {
			id: id,
			discordAuthToken: undefined,
			loginId: 0,
			lastRecommendationScoreUpdate: this.timeHelper.currentDate,
			recommendationScore: 0,
			totalRecommendationScore: 0,
			givenRecommendations: [],
		}
	}
}