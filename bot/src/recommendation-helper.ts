import DiscordClient from "./bot/discord-client";
import Config from "./config";
import DatabaseClient from "./database-client";
import Provider from "./provider";
import TimeHelper from "./time-helper";
import { UserData } from "./types/document-types";

export default class RecommendationHelper {
	private readonly databaseClient: DatabaseClient;
	private readonly timeHelper: TimeHelper;
	private readonly config: Config;
	private readonly discordClient: DiscordClient;

	public constructor(provider: Provider) {
		this.databaseClient = provider.get(DatabaseClient);
		this.timeHelper = provider.get(TimeHelper);
		this.config = provider.get(Config);
		this.discordClient = provider.get(DiscordClient);
	}

	public async addRecommendationScore(user: UserData|string, addAmount: number, force?: boolean) {
		let userToUpdate: UserData;
		if (typeof user === "string") {
			userToUpdate = await this.databaseClient.userRepository.get(user);
		} else {
			userToUpdate = user;
		}

		const checkpoint = force ? 0 : this.getRecommendationCheckpoint(userToUpdate.recommendationScore);
		const score = this.getRecommendationScore(userToUpdate);
		userToUpdate.totalRecommendationScore += Math.max(0, addAmount);
		userToUpdate.recommendationScore = Math.max(checkpoint, score + addAmount);
		userToUpdate.lastRecommendationScoreUpdate = new Date();
		await this.databaseClient.userRepository.updateRecommendationScore(userToUpdate);
		await this.updateRecommendationRole(userToUpdate);
	}

	public getRecommendationScore(user: UserData): number {
		const timeSinceLastUpdate = this.timeHelper.currentDate.getTime() - user.lastRecommendationScoreUpdate.getTime();
		const hoursSincelastUpdate = timeSinceLastUpdate / (1000 * 60 * 60 /*1 hour*/);

		const actualScore = user.recommendationScore - hoursSincelastUpdate * this.config.rawConfig.recommendation.baseAmountOfScoreToLosePerHour;
		if (Number.isFinite(actualScore)) {
			const checkpoint = this.getRecommendationCheckpoint(user.recommendationScore);
			return Math.max(checkpoint, actualScore);
		}
		return 0;
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
		if (!user.lastPingAt) {
			return 0;
		}

		const timeSinceLastPing = this.timeHelper.currentDate.getTime() - user.lastPingAt.getTime();

		return Math.max(0, totalPingDelay - timeSinceLastPing);
	}

	public canUseImages(user: UserData) {
		return user.totalRecommendationScore >= this.config.rawConfig.recommendation.imageUnlockAt;
	}

	public async getMillisecondsLeftBeforeBeingAbleToRecommendAnyUser(recommender: UserData|string) {
		const oneDayAgo = this.timeHelper.currentDate;
		oneDayAgo.setUTCDate(oneDayAgo.getUTCDate() - 1);
		const maxGivesPerDay = await this.getMaxRecommendationGivesPerDay(recommender);
		const latestRecommendations = await this.databaseClient.userRepository.getLatestRecommendations(recommender, oneDayAgo);

		if (maxGivesPerDay === 0) {
			return null;
		}

		if (latestRecommendations.length >= maxGivesPerDay) {
			const firstRecommendation = latestRecommendations[0];
			return firstRecommendation.recommendedAt.getTime() - oneDayAgo.getTime();
		}

		return 0;
	}

	public async getMillisecondsLeftBeforeBeingAbleToRecommendToUser(recommender: UserData|string, recommend: string) {
		const lastRecommendationForUser = await this.databaseClient.userRepository.getLastRecommendationForUser(recommender, recommend);
		if (!lastRecommendationForUser) {
			return 0;
		}

		const millisecondsSinceLastRecommendation = this.timeHelper.currentDate.getTime() - lastRecommendationForUser.recommendedAt.getTime();
		const recommendTimeoutMilliseconds = this.config.rawConfig.recommendation.give.cooldownHours * (1000 * 60 * 60 /*1 hour*/);
		return Math.max(0, recommendTimeoutMilliseconds - millisecondsSinceLastRecommendation);
	}

	private async getMaxRecommendationGivesPerDay(recommender: UserData|string) {
		const partialUnlockAt = this.config.rawConfig.recommendation.give.partialUnlockAt
		const fullUnlockAt = this.config.rawConfig.recommendation.give.fullUnlockAt;
		const maxAtPartialUnlock = this.config.rawConfig.recommendation.give.maxGivesPerDayAtPartialUnlock;
		const maxAtFullUnlock = this.config.rawConfig.recommendation.give.maxGivesPerDayAtFullUnlock;

		const recommenderData = typeof recommender === "string" ? await this.databaseClient.userRepository.get(recommender) : recommender;
		if (recommenderData.totalRecommendationScore < this.config.rawConfig.recommendation.give.partialUnlockAt) {
			return 0;
		}
		if (recommenderData.totalRecommendationScore >= this.config.rawConfig.recommendation.give.fullUnlockAt) {
			return this.config.rawConfig.recommendation.give.maxGivesPerDayAtFullUnlock;
		}
		return Math.floor((recommenderData.totalRecommendationScore - partialUnlockAt) / (fullUnlockAt - partialUnlockAt) * (maxAtFullUnlock - maxAtPartialUnlock) + maxAtPartialUnlock);
	}

	public async updateRecommendationRole(user: string|UserData) {
		const userData = typeof user === "string" ? await this.databaseClient.userRepository.get(user) : user;
		const discordUser = await this.discordClient.getMember(userData.id);
		if (!discordUser){
			return;
		}

		const score = this.getRecommendationScore(userData);
		const roleToGive = this.getRoleForRecommendation(score);
		if (roleToGive && discordUser.roles.cache.has(roleToGive.roleId)) {
			return;
		}

		const rolesToRemove = this.config.roleIds.unlocks.filter(unlock => unlock.roleId !== roleToGive?.roleId);

		await discordUser.roles.remove(rolesToRemove.map(role => role.roleId));
		if (roleToGive) {
			await discordUser.roles.add(roleToGive.roleId);
		}
	}

	private getRecommendationCheckpoint(recommendation: number) {
		const checkpoints = this.config.sortedRecommendationCheckpoints;
		for (const checkpoint of checkpoints) {
			if (recommendation > checkpoint) {
				return checkpoint;
			}
		}

		return 0;
	}

	private getRoleForRecommendation(recommendation: number) {
		let highestedUnlockedRole: null|{roleId: string, requiredRecommendation: number} = null;
		for (const roleUnlock of this.config.roleIds.unlocks) {
			if (roleUnlock.requiredRecommendation <= recommendation && (highestedUnlockedRole === null || highestedUnlockedRole.requiredRecommendation < roleUnlock.requiredRecommendation)) {
				highestedUnlockedRole = roleUnlock;
			}
		}

		return highestedUnlockedRole;
	}
}