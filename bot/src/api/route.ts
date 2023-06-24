import Provider from "../provider";
import type { Express, RequestHandler} from "express";
import WebResponses from "./responses";

type RouteMakerArgs = {
	server: Express;
	provider: Provider;
	responses: WebResponses;
	isAuthenticatedGuard: RequestHandler;
}
type RouteMaker = (args: RouteMakerArgs) => void;
export default RouteMaker;