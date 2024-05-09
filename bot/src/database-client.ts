import Config from "./config";
import * as Mongo from "mongodb";
import SessionRepository from "./repositories/session-repository";
import UserRepository from "./repositories/user-repository";
import BansRepository from "./repositories/bans-repository";
import ExperienceRepository from "./repositories/experience-repository";
import ImageRepository from "./repositories/image-repository";
import injectDependency from "./shared/dependency-provider/inject-dependency";

export default class DatabaseClient {
	private client: Mongo.MongoClient;
	private config = injectDependency(Config);

	public readonly sessionRepository: SessionRepository;
	public readonly userRepository: UserRepository;
	public readonly bansRepository: BansRepository;
	public readonly experienceRepository: ExperienceRepository;
	public readonly imageRepository: ImageRepository;

	public constructor() {
		this.client = new Mongo.MongoClient(this.config.databaseUrl);

		const db = this.client.db(this.config.databaseName);
		this.sessionRepository = new SessionRepository(db.collection("Sessions"));
		this.userRepository = new UserRepository(db.collection("Users"));
		this.bansRepository = new BansRepository(db.collection("Bans"));
		this.experienceRepository = new ExperienceRepository(db.collection("Experiences"));
		this.imageRepository = new ImageRepository(db.collection("Images"));
	}

	public async connect() {
		await this.client.connect();
	}
}