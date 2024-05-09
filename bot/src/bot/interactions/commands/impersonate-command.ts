import { PermissionFlagsBits, ChatInputCommandInteraction } from "discord.js";
import Impersonation from "../../../impersonation";
import Command, { CommandExecutionContext } from "./command";

class ImpersonateCommand extends Command {
	public constructor() {
		super("impersonate");
	}

	public create() {
		return this.buildBaseCommand()
			.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
			.setDescription("Lets you or someone else impersonate another user when making interactions.")
			.addSubcommand(subCommand =>
				subCommand.setName("clear")
				.setDescription("Stop impersonation.")
				.addUserOption(option =>
					option.setName("impersonator")
					.setRequired(false)
					.setDescription("The user which no longer should impersonate someone else. (Defaults to you)")))
			.addSubcommand(subCommand => 
				subCommand.setName("user")
				.setDescription("Impersonate a user.")
				.addUserOption(option =>
					option.setName("impersonate")
					.setRequired(true)
					.setDescription("The user to impersonate."))
				.addUserOption(option =>
					option.setName("impersonator")
					.setRequired(false)
					.setDescription("The user which should impersonate. (Defaults to you)")));
	}

	public async handleExecution({provider, interaction, getMemberOption}: CommandExecutionContext) {
		const impersonation = provider.get(Impersonation);

		const subCommand = interaction.options.getSubcommand(true);
		if (subCommand === "clear") {
			await this.handleClearSubCommand(impersonation, interaction, getMemberOption);
		} else if (subCommand === "user") {
			await this.handleUserSubCommand(impersonation, interaction, getMemberOption);
		} else {
			interaction.reply({ephemeral: true, content: `Invalid subcommand "${subCommand}".`});
		}
	}

	private async handleClearSubCommand(impersonation: Impersonation, interaction: ChatInputCommandInteraction, getMemberOption: CommandExecutionContext["getMemberOption"]) {
		await interaction.deferReply({ephemeral: true});
		const clearFor = await getMemberOption("impersonator") ?? interaction.user;
		impersonation.clearImpersonation(clearFor.id);
		await interaction.editReply({content: `${clearFor} is not longer impersonating.`});
	}

	private async handleUserSubCommand(impersonation: Impersonation, interaction: ChatInputCommandInteraction, getMemberOption: CommandExecutionContext["getMemberOption"]) {
		await interaction.deferReply({ephemeral: true});
		const impersonate = await getMemberOption("impersonate");
		if (!impersonate) {
			await interaction.editReply("Unable to find user to impersonate.")
			return;
		}

		const impersonator = await getMemberOption("impersonator") ?? interaction.user;
		impersonation.addImpersonation(impersonator.id, impersonate.id);

		if (impersonate.id === impersonator.id) {
			interaction.editReply({content: `${impersonator} is no longer impersonating.`});
		} else {
			interaction.editReply({content: `${impersonator} is now impersonating as ${impersonate}.`});
		}
	}
}

export default new ImpersonateCommand();