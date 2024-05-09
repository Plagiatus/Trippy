import RouteMaker from "../route";
import Config from "../../config";
import injectDependency from "../../shared/dependency-provider/inject-dependency";

export default (({server, responses}) => { 
    const config = injectDependency(Config);

	server.route("/settings/play-type-multipliers")
		.get((req, res) => {
			const multipliers = config.rawConfig.recommendation.playTypeMultiplier;

			res.send(multipliers);
		})
		.all(responses.wrongMethod);
}) satisfies RouteMaker