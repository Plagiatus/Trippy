import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { ICommandInteraction } from "../../interaction-types";
import Impersonation from "../../../impersonation";

export default {
	name: "impersonate",
	type: "COMMAND",
	data: new SlashCommandBuilder()
		.setName("impersonate")
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
				.setDescription("The user which should impersonate. (Defaults to you)"))),
	async execute({interaction, provider}){
		const impersonation = provider.get(Impersonation);

		const subCommand = interaction.options.getSubcommand(true);
		if (subCommand === "clear") {
			const clearFor = interaction.options.getUser("impersonator",false) ?? interaction.user;
			impersonation.clearImpersonation(clearFor.id);
			interaction.reply({ephemeral: true, content: `${clearFor} is not longer impersonating.`});
		} else if (subCommand === "user") {
			const impersonate = interaction.options.getUser("impersonate", true);
			const impersonator = interaction.options.getUser("impersonator",false) ?? interaction.user;
			impersonation.addImpersonation(impersonator.id, impersonate.id);

			if (impersonate.id === impersonator.id) {
				interaction.reply({ephemeral: true, content: `${impersonator} is not longer impersonating.`});
			} else {
				interaction.reply({ephemeral: true, content: `${impersonator} is now impersonating as ${impersonate}.`});
			}
		} else {
			interaction.reply({ephemeral: true, content: `Invalid subcommand "${subCommand}".`});
		}
	}
} satisfies ICommandInteraction;