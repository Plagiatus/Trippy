import type { Express } from "express";
import WebResponses from "./responses";

type RouteMakerArgs = {
	server: Express;
	responses: WebResponses;
}
type RouteMaker = (args: RouteMakerArgs) => void;
export default RouteMaker;