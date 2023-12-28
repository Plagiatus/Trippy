import SessionsCollection from "../../../session/sessions-collection";
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

	public async handleExecution({interaction, provider, interactor}: CommandExecutionContext) {
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

		const userToKick = interaction.options.getUser("user");
		if (!userToKick) {
			interaction.reply({ephemeral: true, content: "Cannot kick an invalid user."});
			return;
		}
		
		if (session.isUserInSession(userToKick.id)) {
			await interaction.deferReply({ephemeral: true});
			await session.leave(userToKick.id);
			interaction.editReply(`You have removed ${userToKick} from the session.`)
		} else {
			interaction.reply({ephemeral: true, content: `You cannot kick ${userToKick} from a session they're not in.`});
		}
	}
}

export default new KickCommand();