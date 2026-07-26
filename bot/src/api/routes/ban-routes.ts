import RouteMaker from "../route";
import DatabaseClient from "../../database-client";
import injectDependency from "../../shared/dependency-provider/inject-dependency";
import { getIsAuthenticatedGuard } from "../guards/is-authenticated-guard";
import utils from "../../utils/utils";
import DiscordClient from "../../bot/discord-client";

export default (({server, responses}) => {
	const databaseClient = injectDependency(DatabaseClient);
	const discordClient = injectDependency(DiscordClient);

	server.route("/ban/ban/:userId")
		.post(getIsAuthenticatedGuard(), async (req, res) => {
			const result = await databaseClient.bansRepository.makeUserBanUser({user: req.userId!, userToBan: req.params.userId});
			res.send(result);
		})
		.all(responses.wrongMethod);

	server.route("/ban/unban/:userId")
		.post(getIsAuthenticatedGuard(), async (req, res) => {
			const result = await databaseClient.bansRepository.makeUserUnbanUser({user: req.userId!, userToUnban: req.params.userId});
			res.send(result);
		})
		.all(responses.wrongMethod);

	server.route("/ban/list")
		.get(getIsAuthenticatedGuard(), async (req, res) => {
			const banData = await databaseClient.bansRepository.get(req.userId!);
			const bannedUsers = await utils.asyncMap(banData?.bannedUsers ?? [], id => discordClient.getSimplifiedMember(id));

			res.send({ bannedUsers });
		})
		.all(responses.wrongMethod);
}) satisfies RouteMaker;
