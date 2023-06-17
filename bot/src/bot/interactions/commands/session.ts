import { SlashCommandBuilder } from "discord.js";
import { ICommandInteraction } from "../../interaction-types";
import Config from "../../../config";
import DatabaseClient from "../../../database-client";
import SessionsCollection from "../../../session/sessions-collection";

export default {
	name: "session",
	type: "COMMAND",
	data: new SlashCommandBuilder()
		.setName("session")
		.setDescription("Used for starting sessions.")
		.addStringOption(option => 
			option.setName("template")
			.setDescription("The id of the template to use")
			.setRequired(false)),
	async execute({interaction, provider, interactor}){
		const config = provider.get(Config);
		const databaseClient = provider.get(DatabaseClient);
		const sessionsCollection = provider.get(SessionsCollection);

		const templateId = interaction.options.getString("template", false);

		if (templateId === null) {
			interaction.reply({content: `To create a session you need to create a template here ${config.frontendUrl}/session/setup.`, ephemeral: true});
			return;
		}

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
		await sessionsCollection.startNewSession(interactor.id, template);
		await interaction.editReply({content: `Session has been made!`});
	}
} satisfies ICommandInteraction;