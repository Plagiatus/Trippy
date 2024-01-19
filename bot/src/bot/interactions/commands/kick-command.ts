import SessionsCollection from "../../../session/sessions-collection";
import ModLogMessages from "../messages/mod-log-messages";
import Command, { CommandExecutionContext } from "./command";

class KickCommand extends Command {
	public constructor() {
		super("kick");
	}

	public create() {
		return this.buildBaseCommand()
			.setDescription("Lets you remove players from your session.")
			.addUserOption(option => 
				option.setName("user")
				.setDescription("The user to be removed from the session")
				.setRequired(true));
	}

	public async handleExecution({interaction, provider, interactor, getMemberOption}: CommandExecutionContext) {
		const sessionsCollection = provider.get(SessionsCollection);
		const session = sessionsCollection.getSessionFromChannel(interaction.channelId) ?? sessionsCollection.getHostedSession(interactor);
		if (!session) {
			interaction.reply({ephemeral: true, content: "You are not hosting any session."});
			return;
		}
		if (session.hostId !== interactor.id) {
			interaction.reply({ephemeral: true, content: "You can cannot kick players from this session."});
			return;
		}

		await interaction.deferReply({ephemeral: true});
		const userToKick = await getMemberOption("user");
		if (!userToKick) {
			interaction.editReply({ content: "Cannot kick an invalid user."});
			return;
		}
		
		if (session.isUserInSession(userToKick.id)) {
			await session.leave(userToKick.id, "kicked");
			interaction.editReply(`You have removed ${userToKick} from the session.`);
			ModLogMessages.kick(provider, interactor, userToKick.user);
		} else {
			interaction.editReply({content: `You cannot kick ${userToKick} from a session they're not in.`});
		}
	}
}

export default new KickCommand();