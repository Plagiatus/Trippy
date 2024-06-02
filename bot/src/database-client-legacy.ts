import Config from "./config";
import * as Mongo from "mongodb";
import injectDependency from "./shared/dependency-provider/inject-dependency";
import UserLegacyRepository from "./repositories/user-legacy-repository";

export default class DatabaseLegacyClient {
	private client: Mongo.MongoClient;
	private config = injectDependency(Config);

	public readonly userRepository: UserLegacyRepository;

	public readonly database: Mongo.Db;

	public constructor() {
		this.client = new Mongo.MongoClient(this.config.databaseLegacyUrl);

		this.database = this.client.db(this.config.databaseLegacyName);
		this.userRepository = new UserLegacyRepository(this.database.collection("users"));
	}

	public async connect() {
		await this.client.connect();
	}

	public async close() {
		await this.client.close();
	}
}