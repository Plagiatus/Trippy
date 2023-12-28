import { ButtonStyle } from "discord.js";
import SessionsCollection from "../../../session/sessions-collection";
import DatabaseClient from "../../../database-client";
import ActionButton, { ButtonClickContext } from "./action-button";

const buttonId = "session-join:(sessionId)";
class joinSessionButton extends ActionButton<typeof buttonId> {
	public constructor() {
		super(buttonId);
	}

	public create(options: {sessionId: string}) {
		return this.createBaseButton(options)
			.setLabel("join session")
			.setStyle(ButtonStyle.Primary)
	}

	public async handleClick({provider, buttonParameters, interaction, interactor}: ButtonClickContext<typeof buttonId>): Promise<void> {
		const sessionsCollection = provider.get(SessionsCollection);
		const session = sessionsCollection.getSession(buttonParameters.sessionId);

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
}

export default new joinSessionButton();