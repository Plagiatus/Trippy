import * as Mongo from "mongodb";
import Provider from "../provider";

export default class Repository<TDocument extends Mongo.Document, TId extends keyof TDocument> {
	public constructor(protected readonly provider: Provider, protected readonly collection: Mongo.Collection<TDocument>, protected readonly idField: TId) {

	}

	public async get(id: TDocument[TId]) {
		return await this.collection.findOne(this.getQueryForDocument(id));
	}

	public async add(document: Mongo.OptionalUnlessRequiredId<TDocument>) {
		return await this.collection.insertOne(document);
	}

	public async remove(documentOrId: TDocument|TDocument[TId]) {
		return await this.collection.deleteOne(this.getQueryForDocument(documentOrId));
	}

	protected getQueryForDocument(documentOrId: TDocument|TDocument[TId]): Mongo.Filter<TDocument> {
		const id = (documentOrId && typeof documentOrId === "object") ? documentOrId[this.idField] : documentOrId;
		const query: Partial<TDocument> = {}
		query[this.idField] = id;
		return query;
	}
}