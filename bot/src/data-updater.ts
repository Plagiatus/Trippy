import DatabaseClient from "./database-client";
import injectDependency from "./shared/dependency-provider/inject-dependency";
import { RawSession } from "./types/document-types";

type DataUpdate = {
	toVersion: number,
	run: () => Promise<void>|void
}

export default class DataUpdater {
	private readonly databaseClient = injectDependency(DatabaseClient);

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
			}
		]
	}

	public async runUpdates() {
		const currentVersion = await this.databaseClient.metadataRepository.getDataVersion();

		const updatesToRun = this.updates
			.filter(update => update.toVersion > currentVersion)
			.sort((a,b) => a.toVersion - b.toVersion);

		await this.databaseClient.metadataRepository.setDataVersion(this.newestVersion);

		for (const update of updatesToRun) {
			await update.run();
			console.log(`Updated data to version ${update.toVersion}...`);
		}
	}
}