import DatabaseClient from "../../../database-client";
import Command, { CommandExecutionContext } from "./command";
import BansRepository from "../../../repositories/bans-repository";
import { ChatInputCommandInteraction, GuildMember, MessageFlags } from "discord.js";
import DependencyProvider from "../../../shared/dependency-provider/dependency-provider";

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
			await this.handleBanSubCommand(bans, interaction, interactor, getMemberOption);
		} else if (subCommand === "unban") {
			await this.handleUnbanSubCommand(bans, interaction, interactor, getMemberOption);
		} else if (subCommand === "list") {
			await this.handleListSubCommand(bans, interaction, interactor);
		} else {
			interaction.reply({ flags: MessageFlags.Ephemeral, content: `Invalid subcommand "${subCommand}".` });
			return;
		}
	}

	private async handleBanSubCommand(bans: BansRepository, interaction: ChatInputCommandInteraction, interactor: GuildMember, getMemberOption: CommandExecutionContext["getMemberOption"]) {
		await interaction.deferReply({ flags: MessageFlags.Ephemeral });
		const userToBan = await getMemberOption("user");
		if (!userToBan) {
			interaction.editReply({ content: "User not found." });
			return;
		}

		const result = await bans.makeUserBanUser(interactor.id, userToBan.id);
		if (!result.success) {
			switch (result.error) {
				case "self":
					interaction.editReply({ content: "Why would you ban yourself?" })
					return;
				case "already-banned":
					interaction.editReply({content: `${userToBan} has already been banned.`});
					return;
				default:
					interaction.editReply({content: `Unable to ban ${userToBan}.`});
					return;
			}
		}

		interaction.editReply(`${userToBan} was banned from your sessions.`);
	}

	private async handleUnbanSubCommand(bans: BansRepository, interaction: ChatInputCommandInteraction, interactor: GuildMember, getMemberOption: CommandExecutionContext["getMemberOption"]) {
		await interaction.deferReply({ flags: MessageFlags.Ephemeral });
		const userToUnban = await getMemberOption("user");
		if (!userToUnban) {
			interaction.editReply({ content: "User not found." });
			return;
		}

		const result = await bans.makeUserUnbanUser(interactor.id, userToUnban.id);
		if (!result.success) {
			switch (result.error) {
				case "not-banned":
					interaction.editReply({content: `${userToUnban} isn't banned.`});
					return;
				default:
					interaction.editReply({content: `Unable to unban ${userToUnban}.`});
					return;
			}
		}

		interaction.editReply(`${userToUnban} can join your sessions again.`);
	}

	private async handleListSubCommand(bans: BansRepository, interaction: ChatInputCommandInteraction, interactor: GuildMember) {
		await interaction.deferReply({ flags: MessageFlags.Ephemeral });
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