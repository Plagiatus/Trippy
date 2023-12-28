import { ButtonStyle } from "discord.js";
import SessionsCollection from "../../../session/sessions-collection";
import ActionButton, { ButtonClickContext } from "./action-button";

const buttonId = "session-end:(sessionId)";
class EndSessionButton extends ActionButton<typeof buttonId> {
	public constructor() {
		super(buttonId);
	}

	public create(options: {sessionId: string}) {
		return this.createBaseButton(options)
			.setLabel("End Session")
			.setStyle(ButtonStyle.Danger);
	}

	public async handleClick({provider, interaction, buttonParameters: parameters, interactor}: ButtonClickContext<typeof buttonId>): Promise<void> {
		const sessionsCollection = provider.get(SessionsCollection);
		const session = sessionsCollection.getSession(parameters.sessionId);

		if (!session) {
			interaction.reply({content: "Session couldn't be found. The button shouldn't exist.", ephemeral: true});
			return;
		}

		if (session.state !== "running") {
			interaction.reply({content: "Session isn't running. The button should be disabled.", ephemeral: true});
			return;
		}

		await interaction.deferReply({ephemeral: true});
		const didStopSession = await session.tryStopSession(interactor);
		if (didStopSession) {
			interaction.editReply({content: "Session has been stopped."});
		} else {
			interaction.editReply({content: "You are not able to end the session."});
		}
	}
}
export default new EndSessionButton();