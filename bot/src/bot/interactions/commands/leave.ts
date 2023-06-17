import { SlashCommandBuilder } from "discord.js";
import { ICommandInteraction } from "../../interaction-types";
import SessionsCollection from "../../../session/sessions-collection";

export default {
	name: "leave",
	type: "COMMAND",
	data: new SlashCommandBuilder()
		.setName("leave")
		.setDescription("Makes you leave the session you are in."),
	async execute({interaction, provider, interactor}){
		const sessionsCollection = provider.get(SessionsCollection);

		const session = sessionsCollection.getSessionFromChannel(interaction.channelId) ?? sessionsCollection.getSessionFromUser(interactor);
		if (!session) {
			interaction.reply({ephemeral: true, content: "You are not in any sessions which you can leave."});
			return;
		}

		if (session.isUserInSession(interactor.id)) {
			await interaction.deferReply({ephemeral: true});
			await session.leave(interactor.id);
			interaction.editReply("You have left the session.")
		} else {
			interaction.reply({ephemeral: true, content: "You cannot leave this session."});
		}
	}
} satisfies ICommandInteraction;