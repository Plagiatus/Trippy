import RouteMaker from "../route";
import RecommendationHelper from "../../recommendation-helper";
import injectDependency from "../../shared/dependency-provider/inject-dependency";
import { getIsAuthenticatedGuard } from "../guards/is-authenticated-guard";

export default (({server}) => {
	const recommendationHelper = injectDependency(RecommendationHelper);

	server.route("/recommendation/recommend/:userId")
		.post(getIsAuthenticatedGuard(), async (req, res) => {
			const result = await recommendationHelper.makeUserRecommendUser({ user: req.userId!, recommendUser: req.params.userId});
			res.send(result);
		})
		.all((_, res) => res.sendStatus(405));
}) satisfies RouteMaker;
