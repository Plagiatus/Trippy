import RouteMaker from "../route";
import Config from "../../config";

export default (({server, responses, provider}) => { 
    const config = provider.get(Config);

	server.route("/settings/play-type-multipliers")
		.get((req, res) => {
			const multipliers = config.rawConfig.recommendation.playTypeMultiplier;

			res.send(multipliers);
		})
		.all(responses.wrongMethod);
}) satisfies RouteMaker