import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { ICommandInteraction } from "../../interaction-types";
import SessionsCollection from "../../../session/sessions-collection";

export default {
	name: "kick",
	type: "COMMAND",
	data: new SlashCommandBuilder()
		.setName("kick")
		.setDescription("Lets you remove players from your session.")
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
		.addUserOption(option => 
			option.setName("user")
			.setDescription("The user to be removed from the session")
			.setRequired(true)),
	async execute({interaction, provider, interactor}){
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
} satisfies ICommandInteraction;