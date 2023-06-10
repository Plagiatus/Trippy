import { ButtonBuilder, ButtonStyle } from "discord.js";
import { IButtonInteraction } from "../../interaction-types";
import SessionsCollection from "../../../session/sessions-collection";

export default {
	name: /^session-end:.*$/,
	type: "BUTTON",
	create: (sessionId) => new ButtonBuilder()
		.setCustomId(`session-end:${sessionId}`)
		.setLabel("End Session")
		.setStyle(ButtonStyle.Danger),
	async execute({interaction, provider}) {
		const sessionId = (/session-end:(.*)/).exec(interaction.customId)?.[1] ?? "";
		const sessionsCollection = provider.get(SessionsCollection);
		const session = sessionsCollection.getSession(sessionId);

		if (!session) {
			interaction.reply({content: "Session couldn't be found. The button shouldn't exist.", ephemeral: true});
			return;
		}

		if (session.state !== "running") {
			interaction.reply({content: "Session isn't running. The button should be disabled.", ephemeral: true});
			return;
		}

		await interaction.deferReply({ephemeral: true});
		const didStopSession = await session.tryStopSession(interaction.user);
		if (didStopSession) {
			interaction.editReply({content: "Session has been stopped."});
		} else {
			interaction.editReply({content: "You are not able to end the session."});
		}
	}
} satisfies IButtonInteraction<[sessionId: string]>;