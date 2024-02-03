import { EmbedBuilder } from "discord.js";
import Command, { CommandExecutionContext } from "./command";
import DatabaseClient from "../../../database-client";
import RecommendationHelper from "../../../recommendation-helper";
import utils from "../../../utils/utils";
import constants from "../../../utils/constants";

class StatsCommand extends Command {
	public constructor() {
		super("stats");
	}

	public create() {
		return this.buildBaseCommand()
			.setDescription("Used for viewing your stats.")
			.addBooleanOption(option => option
				.setName("privately")
				.setDescription("Set to true to see your stats without showing it to other people. Defaults to showing to everyone."));
	}

	public async handleExecution({provider, interaction, interactor}: CommandExecutionContext) {
		const showPrivately = interaction.options.getBoolean("privately") ?? false;
		await interaction.deferReply({ephemeral: showPrivately});
		
		const databaseClient = provider.get(DatabaseClient);
		const recommendationHelper = provider.get(RecommendationHelper);
		const userData = await databaseClient.userRepository.get(interactor.user.id);
		const hostedSessions = await databaseClient.sessionRepository.getAmountOfHostedSessions(interactor.user.id);
		const joinedSessions = await databaseClient.sessionRepository.getAmountOfJoinedSessions(interactor.user.id);

		interaction.editReply({
			embeds: [
				new EmbedBuilder()
					.setColor(constants.mainColor)
					.setThumbnail(interactor.user.displayAvatarURL({size: 32}))
					.setTitle(`${interactor.user.displayName}'${/[sz]$/g.test(interactor.user.displayName) ? "" : "s"} stats`)
					.setFields(
						utils.fieldsInColumns([
							{name: "Recommendation", value: Math.round(recommendationHelper.getRecommendationScore(userData)).toString()},
							{name: "Total recommendation", value: Math.round(userData.totalRecommendationScore).toString()},
							{name: "Hosted sessions", value: hostedSessions.toString()},
							{name: "Joined sessions", value: joinedSessions.toString()},
							{name: "Given recommendations", value: userData.givenRecommendations.length.toString()},
						], 2)
					)
					.toJSON(),
			]
		});
	}
}

export default new StatsCommand();