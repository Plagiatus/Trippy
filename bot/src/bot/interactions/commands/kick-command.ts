import { MessageFlags } from "discord.js";
import SessionsCollection from "../../../session/sessions-collection";
import Command, { CommandExecutionContext } from "./command";
import KickHelper from "../../../kick-helper";

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
				.setRequired(true))
			.addBooleanOption(option => option
				.setName("softly")
				.setDescription("Removes the user without making them lose their earned recommendation."));
	}

	public async handleExecution({interaction, provider, interactor, getMemberOption}: CommandExecutionContext) {
		const sessionsCollection = provider.get(SessionsCollection);
		const kickHelper = provider.get(KickHelper);
		const kickSoftly = interaction.options.getBoolean("softly") ?? false;

		const session = sessionsCollection.getSessionFromChannel(interaction.channelId) ?? sessionsCollection.getHostedSession(interactor);
		if (!session) {
			interaction.reply({flags: MessageFlags.Ephemeral, content: "You are not hosting any session."});
			return;
		}

		await interaction.deferReply({flags: MessageFlags.Ephemeral});
		const userToKick = await getMemberOption("user");
		if (!userToKick) {
			interaction.editReply({ content: "Cannot kick an invalid user."});
			return;
		}
		const result = await kickHelper.makeUserKickUser({ session, user: interactor, kickUser: userToKick, softly: kickSoftly });
		if (!result.success) {
			switch (result.error) {
				case "no-permission":
					interaction.editReply({content: "You can cannot kick players from this session."});
					return;
				case "user-not-found":
					interaction.editReply({content: "Cannot kick an invalid user."});
					return;
				default:
					interaction.editReply({content: "Unable to kick the user."});
					return;
			}
		}

		interaction.editReply(`You have ${kickSoftly ? "softly " : ""}removed ${userToKick} from the session.`);
	}
}

export default new KickCommand();