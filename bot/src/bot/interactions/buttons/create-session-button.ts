import { ButtonBuilder, ButtonStyle } from "discord.js";
import { IButtonInteraction } from "../../interaction-types";

export default {
	name: "create-session",
	type: "BUTTON",
	create(link: string) {
		return new ButtonBuilder()
			.setURL(link)
			.setLabel("Create session")
			.setStyle(ButtonStyle.Link)
	},
	async execute() {
		//Shouldn't be executed.
	}
} satisfies IButtonInteraction<[link: string]>;