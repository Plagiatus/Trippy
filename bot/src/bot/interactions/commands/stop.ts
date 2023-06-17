import { SlashCommandBuilder } from "discord.js";
import { ICommandInteraction } from "../../interaction-types";
import SessionsCollection from "../../../session/sessions-collection";

export default {
	name: "stop",
	type: "COMMAND",
	data: new SlashCommandBuilder()
		.setName("stop")
		.setDescription("Stops your session."),
	async execute({interaction, provider, interactor}){
		const sessionsCollection = provider.get(SessionsCollection);

		const session = sessionsCollection.getSessionFromChannel(interaction.channelId) ?? sessionsCollection.getHostedSession(interactor);
		if (!session) {
			interaction.reply({ephemeral: true, content: "You are not in any sessions which you can stop."});
			return;
		}

		if (session.hostId !== interactor.id) {
			interaction.reply({ephemeral: true, content: "You can not stop this session."});
			return;
		}

		await interaction.deferReply({ephemeral: true});
		const didStop = await session.tryStopSession(interactor);
		if (didStop) {
			interaction.editReply({content: "Session has been stopped."});
		} else {
			interaction.editReply({content: "Was unable to stop the session."});
		}
	}
} satisfies ICommandInteraction;