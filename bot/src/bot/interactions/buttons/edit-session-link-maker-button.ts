import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import SessionsCollection from "../../../session/sessions-collection";
import ActionButton, { ButtonClickContext } from "./action-button";
import createEditSessionButton from "./create-edit-session-button";

const buttonId = "session-end:(sessionId)";
class EndSessionButton extends ActionButton<typeof buttonId> {
	public constructor() {
		super(buttonId);
	}

	public create(options: {sessionId: string}) {
		return this.createBaseButton(options)
			.setLabel("Generate link for editing session")
			.setStyle(ButtonStyle.Primary);
	}

	public async handleClick({provider, interaction, buttonParameters, interactor}: ButtonClickContext<typeof buttonId>): Promise<void> {
		const sessionsCollection = provider.get(SessionsCollection);
		const session = sessionsCollection.getSession(buttonParameters.sessionId);

		if (!session) {
			interaction.reply({content: "Session couldn't be found. This button shouldn't exist.", ephemeral: true});
			return;
		}

		if (session.hostId !== interactor.id) {
			interaction.reply({content: "You cannot edit this session.", ephemeral: true});
			return;
		}

		await interaction.deferReply({ephemeral: true});
		const editSessionButton = await createEditSessionButton({provider: provider, forUserId: interactor.id, sessionId: session.uniqueId});
		await interaction.editReply({
			components: [
				new ActionRowBuilder<ButtonBuilder>().addComponents(
					editSessionButton,
				),
			]
		})
	}
}
export default new EndSessionButton();