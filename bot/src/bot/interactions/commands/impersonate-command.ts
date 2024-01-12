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

	public handleExecution({provider, interaction}: CommandExecutionContext) {
		const impersonation = provider.get(Impersonation);

		const subCommand = interaction.options.getSubcommand(true);
		if (subCommand === "clear") {
			this.handleClearSubCommand(impersonation, interaction);
		} else if (subCommand === "user") {
			this.handleUserSubCommand(impersonation, interaction);
		} else {
			interaction.reply({ephemeral: true, content: `Invalid subcommand "${subCommand}".`});
		}
	}

	private handleClearSubCommand(impersonation: Impersonation, interaction: ChatInputCommandInteraction) {
		const clearFor = interaction.options.getUser("impersonator",false) ?? interaction.user;
		impersonation.clearImpersonation(clearFor.id);
		interaction.reply({ephemeral: true, content: `${clearFor} is not longer impersonating.`});
	}

	private handleUserSubCommand(impersonation: Impersonation, interaction: ChatInputCommandInteraction) {
		const impersonate = interaction.options.getUser("impersonate", true);
		const impersonator = interaction.options.getUser("impersonator",false) ?? interaction.user;
		impersonation.addImpersonation(impersonator.id, impersonate.id);

		if (impersonate.id === impersonator.id) {
			interaction.reply({ephemeral: true, content: `${impersonator} is no longer impersonating.`});
		} else {
			interaction.reply({ephemeral: true, content: `${impersonator} is now impersonating as ${impersonate}.`});
		}
	}
}

export default new ImpersonateCommand();