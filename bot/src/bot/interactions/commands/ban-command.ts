import SessionsCollection from "../../../session/sessions-collection";
import DatabaseClient from "../../../database-client";
import Command, { CommandExecutionContext } from "./command";
import BansRepository from "../../../repositories/bans-repository";
import { ChatInputCommandInteraction, GuildMember } from "discord.js";
import Provider from "../../../shared/provider/provider";
import ModLogMessages from "../messages/mod-log-messages";

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

	public async handleExecution({interaction, provider, interactor, getMemberOption }: CommandExecutionContext) {
		const bans = provider.get(DatabaseClient).bansRepository;
		const subCommand = interaction.options.getSubcommand(true);

		if (subCommand === "ban") {
			await this.handleBanSubCommand(provider, bans, interaction, interactor, getMemberOption);
		} else if (subCommand === "unban") {
			await this.handleUnbanSubCommand(provider, bans, interaction, interactor, getMemberOption);
		} else if (subCommand === "list") {
			await this.handleListSubCommand(bans, interaction, interactor);
		} else {
			interaction.reply({ ephemeral: true, content: `Invalid subcommand "${subCommand}".` });
			return;
		}
	}

	private async handleBanSubCommand(provider: Provider, bans: BansRepository, interaction: ChatInputCommandInteraction, interactor: GuildMember, getMemberOption: CommandExecutionContext["getMemberOption"]) {
		await interaction.deferReply({ ephemeral: true });
		const userToBan = await getMemberOption("user");
		if (!userToBan) {
			interaction.editReply({ content: "User not found." })
			return;
		}
		if (userToBan.id === interactor.id) {
			interaction.editReply({ content: "Why would you ban yourself?" })
			return;
		}

		await bans.ban(interactor.id, userToBan.id);
		interaction.editReply(`${userToBan} was banned from your sessions.`);
		ModLogMessages.ban(provider, interactor, userToBan.user);

		//if player is also currently in the session, kick them.
		const sessionsCollection = provider.get(SessionsCollection);
		const session = sessionsCollection.getSessionFromChannel(interaction.channelId) ?? sessionsCollection.getHostedSession(interactor);
		if (!session) return;
		if (session.hostId !== interactor.id) return;
		if (session.isUserInSession(userToBan.id)) {
			await session.leave(userToBan.id, "banned");
		}
	}

	private async handleUnbanSubCommand(provider: Provider, bans: BansRepository, interaction: ChatInputCommandInteraction, interactor: GuildMember, getMemberOption: CommandExecutionContext["getMemberOption"]) {
		await interaction.deferReply({ ephemeral: true });
		const userToUnban = await getMemberOption("user");
		if (!userToUnban) {
			interaction.editReply({ content: "User not found." })
			return;
		}

		await bans.unban(interactor.id, userToUnban.id);
		interaction.editReply(`${userToUnban} can join your sessions again.`);
		ModLogMessages.unban(provider, interactor, userToUnban.user);
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