import SessionsCollection from "../../../session/sessions-collection";
import DatabaseClient from "../../../database-client";
import Command, { CommandExecutionContext } from "./command";
import BansRepository from "../../../repositories/bans-repository";
import { ChatInputCommandInteraction, GuildMember } from "discord.js";
import Provider from "../../../provider";

class BanCommand extends Command {
	public constructor() {
		super("ban");
	}

	public create() {
		return this.buildBaseCommand()
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
				.setDescription("List all users you banned from joining your sessions."));
	}

	public async handleExecution({interaction, provider, interactor }: CommandExecutionContext) {
		const bans = provider.get(DatabaseClient).bansRepository;
		const subCommand = interaction.options.getSubcommand(true);

		if (subCommand === "ban") {
			await this.handleBanSubCommand(provider, bans, interaction, interactor);
		} else if (subCommand === "unban") {
			await this.handleUnbanSubCommand(bans, interaction, interactor);
		} else if (subCommand === "list") {
			await this.handleListSubCommand(bans, interaction, interactor);
		} else {
			interaction.reply({ ephemeral: true, content: `Invalid subcommand "${subCommand}".` });
			return;
		}
	}

	private async handleBanSubCommand(provider: Provider, bans: BansRepository, interaction: ChatInputCommandInteraction, interactor: GuildMember) {
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
	}

	private async handleUnbanSubCommand(bans: BansRepository, interaction: ChatInputCommandInteraction, interactor: GuildMember) {
		const userToUnban = interaction.options.getUser("user", true);
		if (!userToUnban) {
			interaction.reply({ ephemeral: true, content: "User not found." })
			return;
		}

		await interaction.deferReply({ ephemeral: true });
		await bans.unban(interactor.id, userToUnban.id);
		interaction.editReply(`${userToUnban} can join your sessions again.`);
	}

	private async handleListSubCommand(bans: BansRepository, interaction: ChatInputCommandInteraction, interactor: GuildMember) {
		await interaction.deferReply({ ephemeral: true });
		const bandata = await bans.get(interactor.id);
		if (!bandata || bandata.bannedUsers.length === 0) {
			interaction.editReply({ content: `You haven't banned any users.` });
			return;
		}
		const usersList = bandata.bannedUsers.map((user) => `<@${user}>`).join(", ");
		interaction.editReply({ content: `There are ${bandata.bannedUsers.length} users on your banned list:\n${usersList}` });
	}
}

export default new BanCommand();