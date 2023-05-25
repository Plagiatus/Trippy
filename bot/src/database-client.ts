import Config from "./config";
import Provider from "./provider";
import * as Mongo from "mongodb";
import Repository from "./repositories/repository";
import SessionRepository from "./repositories/session-repository";
import { SessionTemplate } from "./types/document-types";

export default class DatabaseClient {
	private client: Mongo.MongoClient;
	private config: Config;

	public readonly sessionTemplateRepository: Repository<SessionTemplate, "code">;
	public readonly sessionRepository: SessionRepository;

	public constructor(provider: Provider) {
		this.config = provider.get(Config);
		this.client = new Mongo.MongoClient(this.config.databaseUrl);

		const db = this.client.db(this.config.databaseName);
		this.sessionTemplateRepository = new Repository(provider, db.collection("Sessions"), "code");
		this.sessionRepository = new SessionRepository(provider, db.collection("Sessions"), "id");
	}

	public async connect() {
		await this.client.connect();
	}
}