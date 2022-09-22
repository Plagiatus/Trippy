import { server } from "./api/main";
import { errorHandler } from "./bot/error";
import { checkExistanceOfConfigThings, client } from "./bot/main";
import { config } from "./data";
import { db } from "./db";


async function start(){
	//connect to DB
	await db.connect();

	//start HTTP Server
	server.listen(config.port);

	//connect bot
	await client.login(config.botToken);
	await checkExistanceOfConfigThings();

	// start error handler advanced mode
	errorHandler.handleTheBigOnes();

	console.log("\x1b[44mReady to go.\x1b[49m");
}

start();