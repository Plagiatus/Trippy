import * as Mongo from "mongodb";
import { config } from "./data";



class Database {
	static instance: Database | null;
	readonly url: string;
	readonly client: Mongo.MongoClient;
	
	constructor(){
		this.url = `mongodb://${config.db.user}:${config.db.password}@${config.db.url}`;
		if (!config.db.name || !config.db.password) {
			this.url = `mongodb://${config.db.url}`;
		}
		this.client = new Mongo.MongoClient(this.url);
		Database.instance = this;
		console.log("db instantiated.");
		if(Database.instance) return Database.instance;
	}
	
	async connect(){
		await this.client.connect();
		console.log("db connected.");
	}
}

export const db = new Database();