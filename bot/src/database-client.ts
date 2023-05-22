import Config from "./config";
import Provider from "./provider";
import * as Mongo from "mongodb";

export default class DatabaseClient {
	private client: Mongo.MongoClient;

	public constructor(provider: Provider) {
		const config = provider.get(Config);
		this.client = new Mongo.MongoClient(config.databaseUrl);
	}

	public connect() {
		return this.client.connect();
	}
}