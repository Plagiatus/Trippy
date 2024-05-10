import Config from "./config";
import * as Mongo from "mongodb";
import SessionRepository from "./repositories/session-repository";
import UserRepository from "./repositories/user-repository";
import BansRepository from "./repositories/bans-repository";
import ExperienceRepository from "./repositories/experience-repository";
import ImageRepository from "./repositories/image-repository";
import injectDependency from "./shared/dependency-provider/inject-dependency";
import MetadataRepository from "./repositories/metadata-repository";

export default class DatabaseClient {
	private client: Mongo.MongoClient;
	private config = injectDependency(Config);

	public readonly sessionRepository: SessionRepository;
	public readonly userRepository: UserRepository;
	public readonly bansRepository: BansRepository;
	public readonly experienceRepository: ExperienceRepository;
	public readonly imageRepository: ImageRepository;
	public readonly metadataRepository: MetadataRepository;

	public readonly database: Mongo.Db;

	public constructor() {
		this.client = new Mongo.MongoClient(this.config.databaseUrl);

		this.database = this.client.db(this.config.databaseName);
		this.metadataRepository = new MetadataRepository(this.database.collection("Metadata"));
		this.sessionRepository = new SessionRepository(this.database.collection("Sessions"));
		this.userRepository = new UserRepository(this.database.collection("Users"));
		this.bansRepository = new BansRepository(this.database.collection("Bans"));
		this.experienceRepository = new ExperienceRepository(this.database.collection("Experiences"));
		this.imageRepository = new ImageRepository(this.database.collection("Images"));
	}

	public async connect() {
		await this.client.connect();
	}

	public async close() {
		await this.client.close();
	}
}