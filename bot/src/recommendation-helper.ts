import Config from "./config";
import DatabaseClient from "./database-client";
import Provider from "./provider";
import TimeHelper from "./time-helper";
import { UserData } from "./types/document-types";

export default class RecommendationHelper {
	private readonly databaseClient: DatabaseClient;
	private readonly timeHelper: TimeHelper;
	private readonly config: Config;

	public constructor(provider: Provider) {
		this.databaseClient = provider.get(DatabaseClient);
		this.timeHelper = provider.get(TimeHelper);
		this.config = provider.get(Config);
	}

	public async addRecommendationScore(user: UserData|string, addAmount: number) {
		let userToUpdate: UserData;
		if (typeof user === "string") {
			userToUpdate = await this.databaseClient.userRepository.get(user);
		} else {
			userToUpdate = user;
		}

		const score = this.getRecommendationScore(userToUpdate);
		userToUpdate.totalRecommendationScore += Math.max(0, addAmount);
		userToUpdate.recommendationScore = Math.max(0, score + addAmount);
		userToUpdate.lastRecommendationScoreUpdate = new Date();
		await this.databaseClient.userRepository.updateRecommendationScore(userToUpdate);
	}

	public getRecommendationScore(user: UserData): number {
		// Users will lose [recommendationScore] * ([baseAmountOfScoreToLosePerHour] / [totalRecommendationScore]) score each hour.
		// This means the first hour the user will lose [baseAmountOfScoreToLosePerHour] score
		// and afterwards the user will lose less and less score each hour
		// as the difference between [recommendationScore] and [totalRecommendationScore] grows bigger.
		// This means that active users will lose less score if/when going inactive compared to less active users.
		
		const baseAmountOfScoreToLosePerHour = 1/24;
		const timeSinceLastUpdate = this.timeHelper.currentDate.getTime() - user.lastRecommendationScoreUpdate.getTime();
		const hoursSincelastUpdate = timeSinceLastUpdate / (1000 * 60 * 60 /*1 hour*/);

		const actualScore = user.recommendationScore * Math.pow(1 - (baseAmountOfScoreToLosePerHour / user.totalRecommendationScore), hoursSincelastUpdate);
		return actualScore;
	}

	public getTotalPingDelayInMilliseconds(user: UserData) {
		const score = user.totalRecommendationScore;
		const partialUnlockAt = this.config.rawConfig.recommendation.pingUnlock.partialUnlockAt;
		const fullUnlockAt = this.config.rawConfig.recommendation.pingUnlock.fullUnlockAt;
		const hoursOfDelayAtPartialUnlock = this.config.rawConfig.recommendation.pingUnlock.hoursOfDelayAtPartialUnlock;

		if (score < partialUnlockAt) {
			return null;
		}
		if (score >= fullUnlockAt) {
			return 0;
		}

		const millisecondsPerHour = 1000 * 60 * 60;
		return (1 - (score - partialUnlockAt) / (fullUnlockAt - partialUnlockAt)) * hoursOfDelayAtPartialUnlock * millisecondsPerHour;
	}

	public getMillisecondsTillNextAllowedPing(user: UserData) {
		const totalPingDelay = this.getTotalPingDelayInMilliseconds(user);
		if (totalPingDelay === null) {
			return null;
		}

		const timeSinceLastPing = user.lastPingAt ? this.timeHelper.currentDate.getTime() - user.lastPingAt.getTime() : 0;

		return Math.max(0, totalPingDelay - timeSinceLastPing);
	}

	public canUseImages(user: UserData) {
		return user.totalRecommendationScore >= this.config.rawConfig.recommendation.imageUnlockAt;
	}
}