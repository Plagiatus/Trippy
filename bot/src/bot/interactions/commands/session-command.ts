import { ActionRowBuilder, ButtonBuilder, ChatInputCommandInteraction, GuildMember } from "discord.js";
import DatabaseClient from "../../../database-client";
import SessionsCollection from "../../../session/sessions-collection";
import { SessionBlueprint } from "../../../types/session-blueprint-types";
import createCreateSessionButton from "../buttons/create-create-session-button";
import Command, { CommandExecutionContext } from "./command";
import Provider from "../../../provider";

class SessionCommand extends Command {
	public constructor() {
		super("session");
	}

	public create() {
		return this.buildBaseCommand()
			.setDescription("Used for starting sessions.")
			.addStringOption(option => 
				option.setName("template")
				.setDescription("The id of the template to use")
				.setRequired(false));
	}

	public async handleExecution({provider, interaction, interactor}: CommandExecutionContext) {
		const templateId = interaction.options.getString("template", false);

		if (templateId === null) {
			await this.handleStartNewSessionCommand(provider, interaction, interactor);
		} else {
			await this.handleSessionFromTemplateCommand(provider, interaction, interactor, templateId);
		}
	}

	private async handleStartNewSessionCommand(provider: Provider, interaction: ChatInputCommandInteraction, interactor: GuildMember) {
		interaction.reply({
			content: `Click the button below to get to the session setup website.`, ephemeral: true,
			components: [
				new ActionRowBuilder<ButtonBuilder>().addComponents(
					await createCreateSessionButton({provider, forUserId: interactor.id})
				)
			]
		});
	}

	private async handleSessionFromTemplateCommand(provider: Provider, interaction: ChatInputCommandInteraction, interactor: GuildMember, templateId: string) {
		const databaseClient = provider.get(DatabaseClient);
		const sessionsCollection = provider.get(SessionsCollection);
		
		await interaction.deferReply({ephemeral: true});
		const template = await databaseClient.sessionTemplateRepository.get(templateId);
		if (template === null) {
			await interaction.editReply({content: `Failed to find template with the id "${templateId}".`})
			return;
		}

		if (sessionsCollection.getHostedSession(interactor.id)) {
			await interaction.editReply({content: `You cannot start another session since you already are hosting one.`});
			return;
		}

		if (sessionsCollection.getJoinedSession(interactor.id)) {
			await interaction.editReply({content: `You cannot start a session since you currently are inside of a session.`});
			return;
		}

		await interaction.editReply({content: `Creating session...`});
		await sessionsCollection.startNewSession(interactor.id, {...template, code: undefined} as SessionBlueprint);
		await interaction.editReply({content: `Session has been made!`});
	}
}

export default new SessionCommand();