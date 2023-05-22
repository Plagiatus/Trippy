import Provider from "../provider";
import type { Express} from "express";
import WebResponses from "./responses";

type RouteMakerArgs = {
	server: Express;
	provider: Provider;
	responses: WebResponses;
}
type RouteMaker = (args: RouteMakerArgs) => void;
export default RouteMaker;