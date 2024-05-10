import * as Mongo from "mongodb";

export default class MetadataRepository {
	private static readonly dataVersionId = "data-version";

	public constructor(protected readonly collection: Mongo.Collection<{id: string, value: unknown}>) {

	}

	public async getDataVersion() {
		const result = await this.collection.findOne({
			id: MetadataRepository.dataVersionId
		});

		if (typeof result?.value === "number") {
			return result.value;
		} else {
			return 0;
		}
	}

	public async setDataVersion(version: number) {
		await this.collection.updateMany({
			id: MetadataRepository.dataVersionId
		}, {
			$set: {
				value: version,
			}
		}, {upsert: true});
	}
}