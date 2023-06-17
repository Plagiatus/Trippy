import { ButtonBuilder, ButtonStyle } from "discord.js";
import { IButtonInteraction } from "../../interaction-types";
import SessionsCollection from "../../../session/sessions-collection";

export default {
	name: /^session-leave:.*$/,
	type: "BUTTON",
	create: (sessionId) => new ButtonBuilder()
		.setCustomId(`session-leave:${sessionId}`)
		.setLabel("Leave")
		.setStyle(ButtonStyle.Danger),
	execute({interaction, provider, interactor}){
		const sessionId = (/session-leave:(.*)/).exec(interaction.customId)?.[1] ?? "";
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

		interaction.deferUpdate();
		session.leave(interactor.id);
	}
} satisfies IButtonInteraction<[sessionId: string]>;