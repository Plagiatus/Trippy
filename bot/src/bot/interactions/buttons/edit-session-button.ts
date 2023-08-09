import { ButtonBuilder, ButtonStyle } from "discord.js";
import { IButtonInteraction } from "../../interaction-types";

export default {
	name: "edit-session",
	type: "BUTTON",
	create(link: string, disabled?: boolean) {
		return new ButtonBuilder()
			.setURL(link)
			.setLabel("Edit session")
			.setDisabled(disabled ?? false)
			.setStyle(ButtonStyle.Link)
	},
	async execute() {
		//Shouldn't be executed.
	}
} satisfies IButtonInteraction<[link: string, disabled?: boolean]>;