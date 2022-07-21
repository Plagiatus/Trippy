import { client } from "./bot/main";
import { config } from "./data";
import { db } from "./db";


async function start(){
	//connect to DB
	await db.connect();

	//start HTTP Server

	//connect bot
	client.login(config.botToken);
}

start();