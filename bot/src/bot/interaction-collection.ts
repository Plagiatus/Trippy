import { ButtonInteraction, ChatInputCommandInteraction, GuildMember } from "discord.js";
import utils from "../utils/utils";
import DependencyProvider from "../shared/dependency-provider/dependency-provider";
import Command from "./interactions/commands/command";
import ActionButton from "./interactions/buttons/action-button";
import DiscordClient from "./discord-client";
import injectDependency from "../shared/dependency-provider/inject-dependency";

export default class InteractionCollection {
	public readonly commands: ReadonlyArray<Command>;
	public readonly buttons: ReadonlyArray<ActionButton>;
	private readonly discordClient = injectDependency(DiscordClient, {reference: true});
	private readonly dependencyProvider = DependencyProvider.activeProvider

	public constructor(interactions?: {commands?: ReadonlyArray<Command>, buttons?: ReadonlyArray<ActionButton>}) {
		this.commands = interactions?.commands ?? InteractionCollection.importCommands();
		this.buttons = interactions?.buttons ?? InteractionCollection.importButtons();
	}

	public async executeCommandInteraction(id: string, interaction: ChatInputCommandInteraction, interactor: GuildMember) {
		const command = this.commands.find(command => command.isCommandName(id));
		if (!command) {
			interaction.reply({ephemeral: true, content: `The command "${id}" doesn't exist. Please contact a moderator if this problem persists.`});
			return;
		}

		await command.handleExecution({
			interaction: interaction,
			interactor: interactor,
			provider: this.dependencyProvider,
			getMemberOption: (async (name) => {
				const user = interaction.options.getUser(name);
				if (!user) {
					return null;
				}
	
				const member = await this.discordClient.value.getMember(user.id);
				return member;
			}),
		});
	}

	public async executeButtonInteraction(id: string, interaction: ButtonInteraction, interactor: GuildMember) {
		for (const button of this.buttons) {
			const result = button.isButtonId(id);
			if (!result) {
				continue;
			}

			await button.handleClick({
				buttonParameters: result,
				interaction: interaction,
				interactor: interactor,
				provider: this.dependencyProvider,
			});
			return;
		}

		interaction.reply({ephemeral: true, content: `The button you pressed doesn't exist. Please contact a moderator if this problem persists. Button Id: ${id}`});
	}

	public static importButtons() {
		const actionButtons: ActionButton[] = [];

		const buttonFiles = utils.dynamicImportFolder("bot/interactions/buttons");
		for (const buttonFile of buttonFiles) {
			if (buttonFile.imported instanceof ActionButton) {
				actionButtons.push(buttonFile.imported);
			}
		}

		return actionButtons;
	}

	public static importCommands() {
		const commands: Command[] = [];

		const commandFiles = utils.dynamicImportFolder("bot/interactions/commands");
		for (const commandFile of commandFiles) {
			if (commandFile.imported instanceof Command) {
				commands.push(commandFile.imported);
			}
		}

		return commands;
	}
}