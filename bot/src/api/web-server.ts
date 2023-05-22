import Config from "../config";
import Provider from "../provider";
import express, {Express} from "express";
import utils from "../utils/utils";
import cors from "cors";
import RouteMaker from "./route";
import WebResponses from "./responses";
import bodyParser from "body-parser";

export class WebServer {
	private readonly server: Express;
	private readonly config: Config;
	private readonly responses: WebResponses;

	public constructor(private readonly provider: Provider) {
		this.server = express();
		this.config = provider.get(Config);
		this.responses = provider.get(WebResponses);

		this.server.use(bodyParser.json());
		this.server.use(cors({
			origin: [this.config.frontendUrl],
		}));

		for (const route of WebServer.importRoutes()) {
			this.addRoute(route);
		}

		this.server.all("*", (req, res) => {
			res.sendStatus(404);
		});
	}

	private addRoute(route: RouteMaker) {
		route({
			server: this.server, 
			provider: this.provider,
			responses: this.responses,
		});
	}

	public start() {
		return new Promise<void>(res => this.server.listen(this.config.webServerPort, res));
	}

	public static importRoutes() {
		const routeFiles = utils.dynamicImportFolder<RouteMaker>("api/routes");
		return routeFiles.map(routeFile => routeFile.imported);
	}
}