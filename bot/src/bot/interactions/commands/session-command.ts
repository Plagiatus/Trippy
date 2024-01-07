import { ActionRowBuilder, ButtonBuilder } from "discord.js";
import createCreateSessionButton from "../buttons/create-create-session-button";
import Command, { CommandExecutionContext } from "./command";

class SessionCommand extends Command {
	public constructor() {
		super("session");
	}

	public create() {
		return this.buildBaseCommand().setDescription("Used for starting sessions.");
	}

	public async handleExecution({provider, interaction, interactor}: CommandExecutionContext) {
		interaction.reply({
			content: `Click the button below to get to the session setup website.`, ephemeral: true,
			components: [
				new ActionRowBuilder<ButtonBuilder>().addComponents(
					await createCreateSessionButton({provider, forUserId: interactor.id})
				)
			]
		});
	}
}

export default new SessionCommand();