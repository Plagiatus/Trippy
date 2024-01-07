import Config from "./config";
import Provider from "./provider";
import * as Mongo from "mongodb";
import SessionRepository from "./repositories/session-repository";
import UserRepository from "./repositories/user-repository";
import BansRepository from "./repositories/bans-repository";
import ExperienceRepository from "./repositories/experience-repository";

export default class DatabaseClient {
	private client: Mongo.MongoClient;
	private config: Config;

	public readonly sessionRepository: SessionRepository;
	public readonly userRepository: UserRepository;
	public readonly bansRepository: BansRepository;
	public readonly experienceRepository: ExperienceRepository;

	public constructor(provider: Provider) {
		this.config = provider.get(Config);
		this.client = new Mongo.MongoClient(this.config.databaseUrl);

		const db = this.client.db(this.config.databaseName);
		this.sessionRepository = new SessionRepository(provider, db.collection("Sessions"));
		this.userRepository = new UserRepository(provider, db.collection("Users"));
		this.bansRepository = new BansRepository(provider, db.collection("Bans"));
		this.experienceRepository = new ExperienceRepository(provider, db.collection("Experiences"));
	}

	public async connect() {
		await this.client.connect();
	}
}