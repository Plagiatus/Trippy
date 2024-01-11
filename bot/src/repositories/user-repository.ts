import { UserData } from "../types/document-types";
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
			lastPingAt: this.timeHelper.currentDate,
		});
	}

	public async updateRecommendationScore(document: UserData) {
		await this.collection.updateOne(this.getQueryForDocument(document), {
			recommendationScore: document.recommendationScore,
			lastRecommendationScoreUpdate: document.lastRecommendationScoreUpdate,
			totalRecommendationScore: document.totalRecommendationScore,
		});
	}

	private getNewUserData(id: string): UserData {
		return {
			id: id,
			discordAuthToken: undefined,
			loginId: 0,
			lastRecommendationScoreUpdate: new Date(),
			recommendationScore: 0,
			totalRecommendationScore: 0,
		}
	}
}