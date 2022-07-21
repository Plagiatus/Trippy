interface Config {
	botToken: string,
	appId: string,
	serverId: string,
	db: {
		user: string,
		password: string,
		url: string,
		name: string,
	},
	channels: {
		modLog: string,
		systemLog: string,
		sessionList: string,
		activeSessions: string,
	},
	roles: {
		mods: string,
		hosts: string,
		lvl1: string,
		lvl2: string,
		lvl3: string,
		lvl4: string,
		lvl5: string,
	},
}

type Interaction = iButtonInteraction | iCommandInteraction | iContextMenuInteraction | iModalInteraction;

interface BasicInteraction {
	execute: Function,
	name: string,
}

interface iButtonInteraction extends BasicInteraction {
	type: "BUTTON",
	data: import("discord.js").MessageButton,
}

interface iCommandInteraction extends BasicInteraction {
	type: "COMMAND",
	data: import("discord.js").SlashCommandBuilder,
}

interface iContextMenuInteraction extends BasicInteraction {
	type: "CONTEXT",
	data: import("discord.js").ContextMenuCommandBuilder,
}

interface iModalInteraction extends BasicInteraction {
	type: "MODAL",
	data: import("discord.js").Modal,
}


