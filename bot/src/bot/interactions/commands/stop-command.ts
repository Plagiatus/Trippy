import Config from "../../../config";
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
		const config = provider.get(Config);

		const session = sessionsCollection.getSessionFromChannel(interaction.channelId) ?? sessionsCollection.getHostedSession(interactor);
		if (!session) {
			interaction.reply({ephemeral: true, content: "You are not in any sessions which you can stop."});
			return;
		}

		const isModerator = interactor.roles.cache.has(config.roleIds.mods);
		if (session.hostId !== interactor.id && !isModerator) {
			interaction.reply({ephemeral: true, content: "You can not stop this session."});
			return;
		}

		await interaction.deferReply({ephemeral: true});
		const didStop = await session.tryStopSession(interactor);
		if (didStop) {
			interaction.editReply({content: "Session has been stopped."});
			return;
		}

		if (!isModerator) {
			interaction.editReply({content: "Was unable to stop the session."});
			return;
		}

		await session.forceStopSession(interactor);
		interaction.editReply({content: "Session has been forcefully stopped."});
	}
}

export default new StopCommand();