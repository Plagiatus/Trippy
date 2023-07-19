import { ButtonBuilder, ButtonStyle } from "discord.js";
import { IButtonInteraction } from "../../interaction-types";
import SessionsCollection from "../../../session/sessions-collection";
import DatabaseClient from "../../../database-client";

export default {
	name: /^session-join:.*$/,
	type: "BUTTON",
	create: (sessionId) => new ButtonBuilder()
		.setCustomId(`session-join:${sessionId}`)
		.setLabel("join session")
		.setStyle(ButtonStyle.Primary),
	async execute({interaction, provider, interactor}){
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

		if (session.isUserInSession(interactor.id)) {
			interaction.reply({content: "You are already in this session.", ephemeral: true});
			return;
		}

		if (sessionsCollection.getHostedSession(interactor.id)) {
			interaction.reply({content: "You cannot join the session since you currently are hosting a session.", ephemeral: true});
			return;
		}

		if (sessionsCollection.getJoinedSession(interactor.id)) {
			interaction.reply({content: "You cannot join the session since you already are in a session.", ephemeral: true});
			return;
		}
		
		if (session.playerCount >= session.maxPlayers) {
			interaction.reply({content: "Session is full. Button is supposed to be disabled.", ephemeral: true});
			return;
		}

		const bans = provider.get(DatabaseClient).bansRepository;
		const sessionHost = await session.getHost();
		if (await bans.isUserBanned(sessionHost?.id ?? "", interactor.id)) {
			interaction.reply({content: `${sessionHost} has banned you from their sessions.`})
			return;
		}
		
		await interaction.deferUpdate();
		await session.join(interactor.id);
	}
} satisfies IButtonInteraction<[sessionId: string]>;