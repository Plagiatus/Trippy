import Config from "../config";
import DependencyProvider from "../shared/dependency-provider/dependency-provider";
import express, {Express } from "express";
import utils from "../utils/utils";
import cors from "cors";
import RouteMaker from "./route";
import WebResponses from "./responses";
import bodyParser from "body-parser";
import upload, { memoryStorage } from "multer";
import injectDependency from "../shared/dependency-provider/inject-dependency";

export class WebServer {
	private readonly server: Express;
	private readonly config = injectDependency(Config);
	private readonly responses = injectDependency(WebResponses);
	private readonly dependencyProvider = DependencyProvider.activeProvider;

	public constructor() {
		this.server = express();

		this.server.use(bodyParser.json());
		this.server.use(cors({
			origin: [this.config.frontendUrl],
		}));

		const fileStorage = memoryStorage();
		const fileUpload = upload({ storage: fileStorage });
		this.server.use(fileUpload.any());

		for (const route of WebServer.importRoutes()) {
			this.addRoute(route);
		}

		this.server.all("*", (req, res) => {
			res.sendStatus(404);
		});
	}

	private addRoute(route: RouteMaker) {
		this.dependencyProvider.activate(() => {
			route({
				server: this.server, 
				responses: this.responses,
			});
		});
	}

	public async start() {
		return new Promise<void>(res => {
			this.server.listen(this.config.webServerPort, res);
		});
	}

	public static importRoutes() {
		const routeFiles = utils.dynamicImportFolder<RouteMaker>("api/routes");
		return routeFiles.map(routeFile => routeFile.imported);
	}
}