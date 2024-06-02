import WebResponses from "./api/responses";
import { WebServer } from "./api/web-server";
import Config from "./config";
import DatabaseClient from "./database-client";
import DatabaseLegacyClient from "./database-client-legacy";
import DependencyProvider from "./shared/dependency-provider/dependency-provider";
import DiscordClient from "./bot/discord-client";
import ErrorHandler from "./bot/error-handler";
import InteractionCollection from "./bot/interaction-collection";
import SessionsCollection from "./session/sessions-collection";
import Impersonation from "./impersonation";
import AuthenticationService from "./authentication-service";
import TimeHelper from "./time-helper";
import RecommendationHelper from "./recommendation-helper";
import BlueprintHelper from "./blueprint-helper";
import { isAuthenticatedGuardFactory, isAuthenticatedGuardKey } from "./api/guards/is-authenticated-guard";
import SessionEmbedBuilder from "./session-embed-builder";
import JsonSchemasBuilder from "./json-schemas-builder";
import TagsHelper from "./shared/tags-helper";

async function start(){
	console.log("Starting...");

	const provider = new DependencyProvider()
		.addFactory(Config, () => Config.loadConfigFile(Config.getEnvironmentConfigPath()))
		.addConstructor(DatabaseClient)
		.addConstructor(DatabaseLegacyClient)
		.addConstructor(WebServer)
		.addConstructor(WebResponses)
		.addConstructor(DiscordClient)
		.addConstructor(ErrorHandler)
		.addConstructor(SessionsCollection)
		.addConstructor(Impersonation)
		.addConstructor(AuthenticationService)
		.addFactory(InteractionCollection, () => new InteractionCollection())
		.addConstructor(TimeHelper)
		.addConstructor(RecommendationHelper)
		.addConstructor(BlueprintHelper)
		.addConstructor(SessionEmbedBuilder)
		.addConstructor(JsonSchemasBuilder)
		.addFactory(TagsHelper, () => new TagsHelper())
		.addFactory(isAuthenticatedGuardKey, isAuthenticatedGuardFactory);

	await provider.get(DatabaseClient).connect();
	console.log("Connected to database...");

	await provider.get(DatabaseLegacyClient).connect();
	console.log("Connected to legacy database...");

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