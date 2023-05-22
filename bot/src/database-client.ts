import Config from "./config";
import Provider from "./provider";
import * as Mongo from "mongodb";
import { SessionBlueprint, SessionPlayer, iSession } from "./types";

export default class DatabaseClient {
	private client: Mongo.MongoClient;
	private config: Config;

	private sessionCollection!: Mongo.Collection<iSession>;
	private sessionBlueprintCollection!: Mongo.Collection<SessionBlueprint>;

	public constructor(provider: Provider) {
		this.config = provider.get(Config);
		this.client = new Mongo.MongoClient(this.config.databaseUrl);
	}

	public async connect() {
		await this.client.connect();
		const db = this.client.db(this.config.databaseName);
		
		this.sessionCollection = db.collection("Sessions");
		this.sessionBlueprintCollection = db.collection("SessionBlueprints");
	}

	//#region Sessions
	public async getActiveSessions(){
		return this.sessionCollection.find({ endTime: -1 }).toArray();
	} 	
	public async getSessionBlueprint(code: string) {
		return this.sessionBlueprintCollection.findOne({ code });
	}
	//#endregion
}