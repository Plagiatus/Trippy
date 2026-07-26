import RouteMaker from "../route";
import DatabaseClient from "../../database-client";
import injectDependency from "../../shared/dependency-provider/inject-dependency";
import { getIsAuthenticatedGuard } from "../guards/is-authenticated-guard";
import utils from "../../utils/utils";
import DiscordClient from "../../bot/discord-client";

export default (({server}) => {
	const databaseClient = injectDependency(DatabaseClient);
	const discordClient = injectDependency(DiscordClient);

	server.route("/ban/ban/:userId")
		.post(getIsAuthenticatedGuard(), async (req, res) => {
			const result = await databaseClient.bansRepository.makeUserBanUser(req.userId!, req.params.userId);
			res.send(result);
		})
		.all((_, res) => res.sendStatus(405));

	server.route("/ban/unban/:userId")
		.post(getIsAuthenticatedGuard(), async (req, res) => {
			const result = await databaseClient.bansRepository.makeUserUnbanUser(req.userId!, req.params.userId);
			res.send(result);
		})
		.all((_, res) => res.sendStatus(405));

	server.route("/ban/list")
		.get(getIsAuthenticatedGuard(), async (req, res) => {
			const banData = await databaseClient.bansRepository.get(req.userId!);
			const bannedUsers = await utils.asyncMap(banData?.bannedUsers ?? [], id => discordClient.getSimplifiedMember(id));

			res.send({ bannedUsers });
		})
		.all((_, res) => res.sendStatus(405));
}) satisfies RouteMaker;
