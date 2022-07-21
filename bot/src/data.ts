import * as fs from "fs";
import path from "path";
import { validate } from "validate.js";
import { db } from "./db";
import { Constraints } from "./validator/constraints";

export const config: Config = loadConfig();

function loadConfig(): Config {
	let configPath: string = path.join(__dirname, process.argv[2] == "local" ? "/../config_local.json" : "/../config.json");
	// console.log(__dirname, configPath);
	if (!fs.existsSync(configPath)) throw new Error(`Config file not found, looking at "${configPath}".`);
	let fileContent: string = fs.readFileSync(configPath, "utf-8");
	if (!fileContent) throw new Error(`Config file empty.`);
	let config: Config = JSON.parse(fileContent);
	let validation = validate(config, Constraints.Config);
	if (validation) {
		console.error("\n\x1b[41m Config Validation Error: \x1b[49m\n", validation, "");
		throw new Error("Config validation failed. See above for details.");
	}
	console.log("config loaded.")
	return config;
}

export const interactions: Map<string, Interaction> = loadInteractionFiles();
console.log(interactions.size, "interactions loaded.");

function loadInteractionFiles(folder: string = "bot/interactions"): Map<string, Interaction> {
	let interactionFiles: string[] = fs.readdirSync(`${__dirname}/${folder}`);
	let botInteractions: Map<string, Interaction> = new Map<string, Interaction>();
	for (let file of interactionFiles) {
		let path: string = `${folder}/${file}`;		
		if(file.endsWith(".js")){
			const command: Interaction = require(`${__dirname}/${path}`);
			botInteractions.set(command.name, command);
			continue;
		}
		if(fs.statSync(`${__dirname}/${path}`).isDirectory()){
			botInteractions = new Map([...botInteractions, ...loadInteractionFiles(path)]);
		}
	}

	return botInteractions;
}