import { EmbedBuilder, GuildMember, GuildMemberRoleManager, PermissionFlagsBits, User } from "discord.js";
import Config from "../../../config";
import DatabaseClient from "../../../database-client";
import RecommendationHelper from "../../../recommendation-helper";
import TimeHelper from "../../../time-helper";
import Command, { CommandExecutionContext } from "./command";
import constants from "../../../utils/constants";

class RecommendCommand extends Command {
	public constructor() {
		super("recommend");
	}

	public create() {
		return this.buildBaseCommand()
			.setDescription("Used for recommending other players. (Give players more recommendation score)")
			.addUserOption(option => option
				.setName("user")
				.setDescription("The user to recommend")
				.setRequired(true))
			.addBooleanOption(option => option
				.setName("privately")
				.setDescription("Set to true if you don't want to announce the recommendation."));
	}

	public async handleExecution({provider, interaction, interactor, getMemberOption}: CommandExecutionContext) {
		const databaseClient = provider.get(DatabaseClient);
		const recommendationHelper = provider.get(RecommendationHelper);
		const config = provider.get(Config);
		const timeHelper = provider.get(TimeHelper);
		
		const dontAnnounce = interaction.options.getBoolean("privately") ?? false;
		await interaction.deferReply({ephemeral: dontAnnounce});

		const recommendUser = await getMemberOption("user");
		if (!recommendUser) {
			interaction.editReply({content: "Can't find the user to recommend."});
			return;
		}

		if (interactor.user.id === recommendUser.id) {
			interaction.editReply({content: "You can't recommend yourself."});
			return;
		}

		const userData = await databaseClient.userRepository.get(interactor.user.id);
		const millisecondsBeforeBeingAbleToRecommendUser = await recommendationHelper.getMillisecondsLeftBeforeBeingAbleToRecommendToUser(userData, recommendUser.id);
		const millisecondsBeforeBeingAbleToRecommendAny = await recommendationHelper.getMillisecondsLeftBeforeBeingAbleToRecommendAnyUser(userData);
		const maxMillisecondsBeforeBeingAbleToRecommend = millisecondsBeforeBeingAbleToRecommendAny !== null
			? Math.max(millisecondsBeforeBeingAbleToRecommendUser, millisecondsBeforeBeingAbleToRecommendAny)
			: millisecondsBeforeBeingAbleToRecommendUser;

		const hasNoDelay = interactor.permissions.has(PermissionFlagsBits.ManageGuild);
		if (maxMillisecondsBeforeBeingAbleToRecommend > 0 && !hasNoDelay) {
			const secondsLeftBeforeBeingAbleToRecommend = Math.ceil((maxMillisecondsBeforeBeingAbleToRecommend + timeHelper.currentDate.getTime()) / 1000);
			if (millisecondsBeforeBeingAbleToRecommendAny) {
				interaction.editReply(`${interactor}, you can first recommend ${recommendUser} or anyone else again <t:${secondsLeftBeforeBeingAbleToRecommend}:R>.`);
			} else {
				interaction.editReply(`${interactor}, you can first recommend ${recommendUser} again <t:${secondsLeftBeforeBeingAbleToRecommend}:R>.`);
			}
			return;
		}

		if (millisecondsBeforeBeingAbleToRecommendAny === null && !hasNoDelay) {
			interaction.editReply(`${interactor}, you are not yet allowed to recommend ${recommendUser} or anyone else.`);
			return;
		}

		await recommendationHelper.addRecommendationScore(recommendUser.id, config.rawConfig.recommendation.give.amount);
		await databaseClient.userRepository.addGivenRecommendation(interactor.user.id, recommendUser.id);

		interaction.editReply({
			embeds: [
				new EmbedBuilder()
					.setAuthor({
						name: interactor.displayName,
						iconURL: interactor.user.avatarURL() ?? undefined,
					})
					.setThumbnail(recommendUser.avatarURL({size: 64}))
					.setDescription(`Recommended ${recommendUser}.`)
					.setColor(constants.mainColor)
					.toJSON(),
			]
		});
	}
}

export default new RecommendCommand();