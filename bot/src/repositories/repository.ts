import * as Mongo from "mongodb";

export default class Repository<TDocument extends Mongo.Document, TId extends keyof TDocument> {
	public constructor(protected readonly collection: Mongo.Collection<TDocument>, protected readonly idField: TId) {

	}

	public async get(id: TDocument[TId]) {
		const document = await this.collection.findOne(this.getQueryForDocument(id));
		return this.removeMongoIdField(document);
	}

	public async add(document: Mongo.OptionalUnlessRequiredId<TDocument>) {
		return await this.collection.insertOne(document);
	}

	public async update(document: TDocument, upsert?: boolean) {
		return await this.collection.replaceOne(this.getQueryForDocument(document), document, {upsert: upsert});
	}

	public async remove(documentOrId: TDocument|TDocument[TId]) {
		return await this.collection.deleteOne(this.getQueryForDocument(documentOrId));
	}

	public async exists(documentOrId: TDocument|TDocument[TId]) {
		return !!(await this.get(this.getId(documentOrId)));
	}

	protected getQueryForDocument(documentOrId: TDocument|TDocument[TId]): Mongo.Filter<TDocument> {
		const id = this.getId(documentOrId);
		const query: Partial<TDocument> = {}
		query[this.idField] = id;
		return query;
	}

	protected removeMongoIdFields(documents: ReadonlyArray<Mongo.WithId<TDocument>>): Array<TDocument> {
		return documents.map(document => this.removeMongoIdField(document)!);
	}

	protected getId(documentOrId: TDocument|TDocument[TId]) {
		const id = (documentOrId && typeof documentOrId === "object") ? documentOrId[this.idField] : documentOrId;
		return id;
	}

	protected removeMongoIdField(document: Mongo.WithId<TDocument>|null): TDocument|null {
		if (document === null) {
			return null;
		}

		const documentCopy = {...document} as TDocument;
		delete documentCopy["_id"];
		return documentCopy;
	}
}