import RouteMaker from "../route";
import injectDependency from "../../shared/dependency-provider/inject-dependency";
import StatsService from "../../stats-service";
import ErrorHandler from "../../bot/error-handler";

export default (({server, responses}) => { 
	const statsService = injectDependency(StatsService);
	const errorHandler = injectDependency(ErrorHandler);

	server.route("/stats/session/:type")
		.get(async (req, res) => {
			const statsType = req.params.type;
			if (statsType !== "day" && statsType !== "week" && statsType !== "month" && statsType !== "year" && statsType !== "all") {
				return responses.sendCustomError("Invalid stats type.", res);
			}

			try {
				const stats = await statsService.getCachedSessionStats(statsType);
				res.send(stats);
			} catch(error) {
				errorHandler.handleGenericError(error, "Failed to get stats.");
				responses.sendCustomError("Failed to get stats.", res);
			}
		})
		.all(responses.wrongMethod);
}) satisfies RouteMaker