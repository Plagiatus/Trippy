import SessionsCollection from "../../../session/sessions-collection";
import Command, { CommandExecutionContext } from "./command";

class LeaveCommand extends Command {
	public constructor() {
		super("leave");
	}

	public create() {
		return this.buildBaseCommand()
			.setDescription("Makes you leave the session you are in.");
	}

	public async handleExecution({provider, interactor, interaction}: CommandExecutionContext) {
		const sessionsCollection = provider.get(SessionsCollection);

		const session = sessionsCollection.getSessionFromChannel(interaction.channelId) ?? sessionsCollection.getJoinedSession(interactor);
		if (!session) {
			interaction.reply({ephemeral: true, content: "You are not in any sessions which you can leave."});
			return;
		}

		if (session.isUserInSession(interactor.id)) {
			await interaction.deferReply({ephemeral: true});
			await session.leave(interactor.id);
			interaction.editReply("You have left the session.")
		} else {
			interaction.reply({ephemeral: true, content: "You cannot leave this session."});
		}
	}
}

export default new LeaveCommand();