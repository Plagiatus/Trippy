import { ChatInputCommandInteraction, GuildMember } from "discord.js";
import Command, { CommandExecutionContext } from "./command";
import DatabaseClient from "../../../database-client";
import UserRepository from "../../../repositories/user-repository";
import constants from "../../../utils/constants";

class RegisterCommand extends Command {
	public constructor() {
		super("register");
	}
	
	public create() {
		return this.buildBaseCommand()
			.setDescription("Used for setting your Minecraft usernames.")
			.addSubcommand(subCommand => subCommand
				.setName("java")
				.setDescription("Link your Java username to you.")
				.addStringOption(option => option
					.setName("username")
					.setDescription("Your Java username.")
					.setRequired(true)))
			.addSubcommand(subCommand => subCommand
				.setName("bedrock")
				.setDescription("Link your Bedrock username to you.")
				.addStringOption(option => option
					.setName("username")
					.setDescription("Your Bedrock username.")
					.setRequired(true)))
			.addSubcommand(subCommand => subCommand
				.setName("view")
				.setDescription("View your usernames."));
	}

	public async handleExecution({provider, interaction, interactor}: CommandExecutionContext) {
		const userRepository = provider.get(DatabaseClient).userRepository;
		const subCommand = interaction.options.getSubcommand(true);

		switch(subCommand) {
			case "java":
				await this.handleJavaRegistration(userRepository, interaction, interactor);
				break;
			case "bedrock":
				await this.handleBedrockRegistration(userRepository, interaction, interactor);
				break;
			case "view":
				await this.handleView(userRepository, interaction, interactor);
				break;
			default:
				interaction.reply({ ephemeral: true, content: `Invalid subcommand "${subCommand}".` });
		}
	}

	private async handleJavaRegistration(userRepository: UserRepository, interaction: ChatInputCommandInteraction, interactor: GuildMember) {
		const username = interaction.options.getString("username", true);
		if (!this.simpleUsernameValidation(username)) {
			interaction.reply({ephemeral: true, content: `The username ${username} is not a valid username.`});
			return;
		}

		await interaction.deferReply({ephemeral: true});
		const user = await userRepository.get(interactor.id);

		user.javaAccount = {
			username: username,
			validated: false,
		}

		await userRepository.update(user);
		await interaction.editReply(`Your Java username has been set to \`${username}\`.`);
	}

	private async handleBedrockRegistration(userRepository: UserRepository, interaction: ChatInputCommandInteraction, interactor: GuildMember) {
		const username = interaction.options.getString("username", true);
		if (!this.simpleUsernameValidation(username)) {
			interaction.reply({ephemeral: true, content: `The username ${username} is not a valid username.`});
			return;
		}

		await interaction.deferReply({ephemeral: true});
		const user = await userRepository.get(interactor.id);

		user.bedrockAccount = {
			username: username,
			validated: false,
		}

		await userRepository.update(user);
		await interaction.editReply(`Your Bedrock username has been set to \`${username}\`.`);
	}

	private async handleView(userRepository: UserRepository, interaction: ChatInputCommandInteraction, interactor: GuildMember) {
		await interaction.deferReply({ephemeral: true});
		const user = await userRepository.get(interactor.id);

		let nameLines: string[] = [];

		if (user.javaAccount) {
			nameLines.push(`${constants.javaEditionIcon} Java: \`${user.javaAccount.username}\` ${user.javaAccount.validated ? " :white_check_mark:" : ""}`);
		}
		if (user.bedrockAccount) {
			nameLines.push(`${constants.bedrockEditionIcon} Bedrock: \`${user.bedrockAccount.username}\` ${user.bedrockAccount.validated ? " :white_check_mark:" : ""}`);
		}

		if (nameLines.length === 0) {
			interaction.editReply(`You don't have any usernames.`);
		} else {
			interaction.editReply(`Your usernames:\n${nameLines.join("\n")}`);
		}
	}

	private simpleUsernameValidation(username: string): boolean {
		const regExp = /^[a-zA-Z0-9 _-]+$/;
		return regExp.test(username);
	}
}

export default new RegisterCommand();