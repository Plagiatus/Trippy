import SessionsCollection from "../../../session/sessions-collection";
import Command, { CommandExecutionContext } from "./command";

class StopCommand extends Command {
	public constructor(){
		super("stop");
	}
	
	public create() {
		return this.buildBaseCommand()
			.setDescription("Stops your session.");
	}

	public async handleExecution({provider, interaction, interactor}: CommandExecutionContext) {
		const sessionsCollection = provider.get(SessionsCollection);

		const session = sessionsCollection.getSessionFromChannel(interaction.channelId) ?? sessionsCollection.getHostedSession(interactor);
		if (!session) {
			interaction.reply({ephemeral: true, content: "You are not in any sessions which you can stop."});
			return;
		}

		if (session.hostId !== interactor.id) {
			interaction.reply({ephemeral: true, content: "You can not stop this session."});
			return;
		}

		await interaction.deferReply({ephemeral: true});
		const didStop = await session.tryStopSession(interactor);
		if (didStop) {
			interaction.editReply({content: "Session has been stopped."});
		} else {
			interaction.editReply({content: "Was unable to stop the session."});
		}
	}
}

export default new StopCommand();