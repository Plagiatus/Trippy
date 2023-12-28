import { ButtonStyle } from "discord.js";
import SessionsCollection from "../../../session/sessions-collection";
import ActionButton, { ButtonClickContext } from "./action-button";

const buttonId = "session-leave:(sessionId)";
class LeaveSessionButton extends ActionButton<typeof buttonId> {
	public constructor() {
		super(buttonId);
	}

	public create(options: {sessionId: string}) {
		return this.createBaseButton(options)
			.setLabel("Leave")
			.setStyle(ButtonStyle.Danger);
	}

	public handleClick({provider, buttonParameters, interaction, interactor}: ButtonClickContext<"session-leave:(sessionId)">): void | Promise<void> {
		const sessionsCollection = provider.get(SessionsCollection);
		const session = sessionsCollection.getSession(buttonParameters.sessionId);

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
}

export default new LeaveSessionButton();