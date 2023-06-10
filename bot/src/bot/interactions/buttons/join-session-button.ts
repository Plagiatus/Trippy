import { ButtonBuilder, ButtonStyle } from "discord.js";
import { IButtonInteraction } from "../../interaction-types";
import SessionsCollection from "../../../session/sessions-collection";

export default {
	name: /^session-join:.*$/,
	type: "BUTTON",
	create: (sessionId) => new ButtonBuilder()
		.setCustomId(`session-join:${sessionId}`)
		.setLabel("join session")
		.setStyle(ButtonStyle.Primary),
	async execute({interaction, provider}){
		const sessionId = (/session-join:(.*)/).exec(interaction.customId)?.[1] ?? "";
		const sessionsCollection = provider.get(SessionsCollection);
		const session = sessionsCollection.getSession(sessionId);

		if (!session) {
			interaction.reply({content: "Session couldn't be found. The button shouldn't exist.", ephemeral: true});
			return;
		}

		if (session.state !== "running") {
			interaction.reply({content: "Session isn't running. The button shouldn't exist.", ephemeral: true});
			return;
		}

		if (session.isUserInSession(interaction.user.id)) {
			interaction.reply({content: "You are already in this session", ephemeral: true});
			return;
		}
		
		if (session.playerCount >= session.maxPlayers) {
			interaction.reply({content: "Session is full. Button is supposed to be disabled.", ephemeral: true});
			return;
		}

		await interaction.deferUpdate();
		await session.join(interaction.user.id);
	}
} satisfies IButtonInteraction<[sessionId: string]>;