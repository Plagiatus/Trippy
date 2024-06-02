import DatabaseClient from "./database-client";
import DatabaseLegacyClient from "./database-client-legacy";
import RecommendationHelper from "./recommendation-helper";
import injectDependency from "./shared/dependency-provider/inject-dependency";
import TimeHelper from "./time-helper";
import { RawSession } from "./types/document-types";

type DataUpdate = {
	toVersion: number,
	run: () => Promise<void> | void
}

export default class DataUpdater {
	private readonly databaseClient = injectDependency(DatabaseClient);
	private readonly legacyDB = injectDependency(DatabaseLegacyClient);
	private readonly recommendationHelper = injectDependency(RecommendationHelper);
	private readonly timeHelper = injectDependency(TimeHelper);


	public get newestVersion() {
		return this.updates.reduce((max, updater) => Math.max(max, updater.toVersion), 0);
	}

	public get updates(): ReadonlyArray<Readonly<DataUpdate>> {
		return [
			{
				toVersion: 1,
				run: async () => {
					const sessionsCollection = this.databaseClient.database.collection<RawSession>("Sessions");
					await sessionsCollection.aggregate([
						{
							$addFields: {
								"blueprint.tags": ["$blueprint.category"]
							}
						},
						{
							$unset: "blueprint.category"
						},
						{
							$merge: {
								into: 'Sessions',
								on: '_id',
							}
						}
					]).toArray();

					const experiencesCollection = this.databaseClient.database.collection<RawSession>("Experiences");
					await experiencesCollection.aggregate([
						{
							$addFields: {
								"defaultBlueprint.tags": ["$defaultBlueprint.category"]
							}
						},
						{
							$unset: "defaultBlueprint.category"
						},
						{
							$merge: {
								into: 'Experiences',
								on: '_id',
							}
						}
					]).toArray();
				}
			},
			{
				toVersion: 2,
				run: async () => {
					const users = this.databaseClient.userRepository;
					await this.legacyDB.connect();
					const legacyUsers = this.legacyDB.userRepository;

					const allLegacyUsers = await legacyUsers.getAll();

					for (let legacyUser of allLegacyUsers) {
						const user = await users.get(legacyUser.discordID);
						if (user.legacyData) continue;
						user.legacyData = {
							experience: legacyUser.experience,
							hostedSessionsDuration: legacyUser.hostedSessionsDuration,
							joinedSessionsDuration: legacyUser.joinedSessionsDuration,
							sessionsHosted: legacyUser.sessionsHosted,
							sessionsJoined: legacyUser.sessionsJoined,
						}

						const oldScore = this.recommendationHelper.getRecommendationScore(user);
						const oldTotalScore = user.totalRecommendationScore;
						const legacyXP = legacyUser.experience;

						let newTotalScore = oldTotalScore + legacyXP;
						let newScore = oldScore + Math.min(legacyXP * 0.1, 500);

						user.totalRecommendationScore = newTotalScore;
						user.recommendationScore = newScore;
						user.lastRecommendationScoreUpdate = this.timeHelper.currentDate;
						
						await users.update(user);
						await this.recommendationHelper.updateRecommendationRole(user);
					}
				}
			}
		]
	}

	public async runUpdates() {
		const currentVersion = await this.databaseClient.metadataRepository.getDataVersion();

		const updatesToRun = this.updates
			.filter(update => update.toVersion > currentVersion)
			.sort((a, b) => a.toVersion - b.toVersion);

		await this.databaseClient.metadataRepository.setDataVersion(this.newestVersion);

		for (const update of updatesToRun) {
			await update.run();
			console.log(`Updated data to version ${update.toVersion}...`);
		}
	}
}