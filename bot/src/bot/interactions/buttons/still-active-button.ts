import { ButtonStyle } from "discord.js";
import SessionsCollection from "../../../session/sessions-collection";
import ActionButton, { ButtonClickContext } from "./action-button";

const buttonId = "session-still-active:(sessionId):(delete)";
class StillActiveButton extends ActionButton<typeof buttonId> {
	public constructor() {
		super(buttonId);
	}

	public create(options: {sessionId: string, deleteMessageOnClick?: boolean}) {
		return this.createBaseButton({sessionId: options.sessionId, delete: options.deleteMessageOnClick ? "true" : "false"})
			.setLabel("Mark session as being active")
			.setStyle(ButtonStyle.Success);
	}

	public async handleClick({provider, buttonParameters, interaction}: ButtonClickContext<typeof buttonId>) {
		const sessionsCollection = provider.get(SessionsCollection);
		const session = sessionsCollection.getSession(buttonParameters.sessionId);

		if (!session) {
			interaction.reply({content: "Session couldn't be found. The button shouldn't exist.", ephemeral: true});
			return;
		}

		if (session.state !== "running") {
			interaction.reply({content: "The session is no longer running and can't be continued.", ephemeral: true});
			return;
		}

		if (buttonParameters.delete === "true" && interaction.message.deletable) {
			interaction.reply({content: "The session will stay open."});
			interaction.message.delete();
		}

		await session.markSessionAsBeingActive();

		if (buttonParameters.delete !== "true") {
			await interaction.reply({content: "The session won't automatically close for a while now.", ephemeral: true});
		}
	}
}

export default new StillActiveButton();