import { GuildMember, SlashCommandBuilder } from "discord.js";
import { ICommandInteraction } from "../../interaction-types";
import SessionsCollection from "../../../session/sessions-collection";
import DatabaseClient from "../../../database-client";
import DiscordClient from "../../discord-client";

export default {
	name: "ban",
	type: "COMMAND",
	data: new SlashCommandBuilder()
		.setName("ban")
		.setDescription("Lets you ban players from joining your sessions.")
		.addSubcommand(subCommand => subCommand
			.setName("ban")
			.setDescription("Ban a user from joining your sessions.")
			.addUserOption(option => option
				.setName("user")
				.setDescription("The user to be banned.")
				.setRequired(true)))
		.addSubcommand(subCommand => subCommand
			.setName("unban")
			.setDescription("Let a user join your sessions again.")
			.addUserOption(option => option
				.setName("user")
				.setDescription("The user to be un-banned.")
				.setRequired(true)))
		.addSubcommand(subCommand => subCommand
			.setName("list")
			.setDescription("List all users you banned from joining your sessions.")),
	async execute({ interaction, provider, interactor }) {
		const bans = provider.get(DatabaseClient).bansRepository;
		const subCommand = interaction.options.getSubcommand(true);

		if (subCommand === "ban") {
			const userToBan = interaction.options.getUser("user", true);
			if (!userToBan) {
				interaction.reply({ ephemeral: true, content: "User not found." })
				return;
			}
			if (userToBan.id === interactor.id) {
				interaction.reply({ ephemeral: true, content: "Why would you ban yourself?" })
				return;
			}

			await interaction.deferReply({ ephemeral: true });
			await bans.ban(interactor.id, userToBan.id);
			interaction.editReply(`${userToBan} was banned from your sessions.`);

			//if player is also currently in the session, kick them.
			const sessionsCollection = provider.get(SessionsCollection);
			const session = sessionsCollection.getSessionFromChannel(interaction.channelId) ?? sessionsCollection.getHostedSession(interactor);
			if (!session) return;
			if (session.hostId !== interactor.id) return;
			if (session.isUserInSession(userToBan.id)) {
				await session.leave(userToBan.id);
			}
		} else if (subCommand === "unban") {
			const userToUnban = interaction.options.getUser("user", true);
			if (!userToUnban) {
				interaction.reply({ ephemeral: true, content: "User not found." })
				return;
			}

			await interaction.deferReply({ ephemeral: true });
			await bans.unban(interactor.id, userToUnban.id);
			interaction.editReply(`${userToUnban} can join your sessions again.`);
		} else if (subCommand === "list") {
			await interaction.deferReply({ ephemeral: true });
			const bandata = await bans.get(interactor.id);
			if (!bandata || bandata.bannedUsers.length === 0) {
				interaction.editReply({ content: `You haven't banned any users.` });
				return;
			}
			interaction.editReply({ content: `There are ${bandata.bannedUsers.length} users on your banned list:\n${bandata.bannedUsers.map((user, index, array) => `<@${user}>${index > array.length - 1 ? ", " : ""}`)}` });
			return;
		} else {
			interaction.reply({ ephemeral: true, content: `Invalid subcommand "${subCommand}".` });
			return;
		}
	}
} satisfies ICommandInteraction;