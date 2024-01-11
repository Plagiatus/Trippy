import WebResponses from "./api/responses";
import { WebServer } from "./api/web-server";
import Config from "./config";
import DatabaseClient from "./database-client";
import Provider from "./provider";
import DiscordClient from "./bot/discord-client";
import ErrorHandler from "./bot/error-handler";
import InteractionCollection from "./bot/interaction-collection";
import SessionsCollection from "./session/sessions-collection";
import Impersonation from "./impersonation";
import AuthenticationService from "./authentication-service";
import TimeHelper from "./time-helper";
import RecommendationHelper from "./recommendation-helper";

async function start(){
	console.log("Starting...");

	const provider = new Provider()
		.addFactory(Config, () => Config.loadConfigFile(Config.getEnvironmentConfigPath()))
		.add(DatabaseClient)
		.add(WebServer)
		.add(WebResponses)
		.add(DiscordClient)
		.add(ErrorHandler)
		.add(SessionsCollection)
		.add(Impersonation)
		.add(AuthenticationService)
		.add(InteractionCollection)
		.add(TimeHelper)
		.add(RecommendationHelper);

	await provider.get(DatabaseClient).connect();
	console.log("Connected to database...");

	await provider.get(WebServer).start();
	console.log("Started web server...");

	const discordClient = provider.get(DiscordClient);

	await discordClient.connect();
	console.log("Connected to Discord...");

	await discordClient.validateGuildIsSetup();
	console.log("Validated Discord guild...");

	const sessionsCollection = provider.get(SessionsCollection);

	await sessionsCollection.loadSessionsFromDatabase();
	console.log(`Reloaded (${sessionsCollection.activeSessionsCount}) sessions from database...`);

	console.log("\x1b[44mReady to go.\x1b[49m");
}

start();