import { ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits, User } from "discord.js";
import Command, { CommandExecutionContext } from "./command";
import DatabaseClient from "../../../database-client";
import RecommendationHelper from "../../../recommendation-helper";
import DependencyProvider from "../../../shared/dependency-provider/dependency-provider";
import utils from "../../../utils/utils";
import constants from "../../../utils/constants";
import TimeHelper from "../../../time-helper";

class ImpersonateCommand extends Command {
	public constructor() {
		super("modify-recommendation");
	}

	public create() {
		return this.buildBaseCommand()
			.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
			.setDescription("Allows you to modify someone's recommendation score.")
			.addSubcommand(subCommand =>
				subCommand.setName("give")
					.setDescription("Give a user recommendation. Can also be used for removing recommendation.")
					.addUserOption(option =>
						option.setName("user")
						.setRequired(true)
						.setDescription("The user to give recommendation to."))
					.addNumberOption(option => 
						option.setName("recommendation")
						.setRequired(true)
						.setDescription("The amount of recommendation to give. Can be negative to remove recommendation."))
					.addBooleanOption(option => 
						option.setName("force")
						.setDescription("Set to true if removing recommendation should ignore recommendation checkpoints.")))
				.addSubcommand(subCommand =>
					subCommand.setName("set")
					.setDescription("Set a user's recommendation.")
					.addUserOption(option =>
						option.setName("user")
						.setRequired(true)
						.setDescription("The user to the recommendation for."))
					.addNumberOption(option => 
						option.setName("recommendation")
						.setRequired(true)
						.setMinValue(0)
						.setDescription("The amount of recommendation the user should have.")))
				.addSubcommand(subCommand =>
					subCommand.setName("set-total")
					.setDescription("Set a user's total recommendation.")
					.addUserOption(option =>
						option.setName("user")
						.setRequired(true)
						.setDescription("The user to the total recommendation for."))
					.addNumberOption(option => 
						option.setName("recommendation")
						.setRequired(true)
						.setMinValue(0)
						.setDescription("The amount of total recommendation the user should have.")))
				.addSubcommand(subCommand =>
					subCommand.setName("view")
					.setDescription("View a user's recommendation score.")
					.addUserOption(option =>
						option.setName("user")
						.setRequired(true)
						.setDescription("The user whose recommendation to show.")));
	}

	public async handleExecution({provider, interaction, getMemberOption}: CommandExecutionContext) {
		await interaction.deferReply({ephemeral: true});
		const subCommand = interaction.options.getSubcommand(true);
		const modifyUser = (await getMemberOption("user"))?.user;
		const recommendation = interaction.options.getNumber("recommendation") ?? 0;

		if (!modifyUser) {
			interaction.editReply({content: "Can't find user."});
			return;
		}

		switch(subCommand) {
			case "give":
				return await this.handleGiveCommand(provider, interaction, modifyUser, recommendation);
			case "set":
				return await this.handleSetCommand(provider, interaction, modifyUser, recommendation);
			case "set-total":
				return await this.handleSetTotalCommand(provider, interaction, modifyUser, recommendation);
			case "view":
				return await this.handleViewCommand(provider, interaction, modifyUser);
		}
	}

	private async handleGiveCommand(provider: DependencyProvider, interaction: ChatInputCommandInteraction, modifyUser: User, recommendation: number) {
		const databaseClient = provider.get(DatabaseClient);
		const recommendationHelper = provider.get(RecommendationHelper);
		const forceChange = interaction.options.getBoolean("force");

		const userData = await databaseClient.userRepository.get(modifyUser.id);
		const oldScore = recommendationHelper.getRecommendationScore(userData);
		const oldTotalScore = userData.totalRecommendationScore;
		await recommendationHelper.addRecommendationScore(userData, recommendation, forceChange ?? undefined);
		const newScore = recommendationHelper.getRecommendationScore(userData);
		const newTotalScore = userData.totalRecommendationScore;

		await this.replyWithOldAndNew(interaction, modifyUser, oldScore, oldTotalScore, newScore, newTotalScore);
	}

	private async handleSetCommand(provider: DependencyProvider, interaction: ChatInputCommandInteraction, modifyUser: User, recommendation: number) {
		const databaseClient = provider.get(DatabaseClient);
		const recommendationHelper = provider.get(RecommendationHelper);
		const timeHelper = provider.get(TimeHelper);

		const userData = await databaseClient.userRepository.get(modifyUser.id);
		const oldScore = recommendationHelper.getRecommendationScore(userData);
		const oldTotalScore = userData.totalRecommendationScore;
		userData.totalRecommendationScore = Math.max(recommendation, oldTotalScore);
		userData.recommendationScore = recommendation;
		userData.lastRecommendationScoreUpdate = timeHelper.currentDate;
		await databaseClient.userRepository.updateRecommendationScore(userData);
		await recommendationHelper.updateRecommendationRole(userData);
		const newScore = recommendationHelper.getRecommendationScore(userData);
		const newTotalScore = userData.totalRecommendationScore;

		await this.replyWithOldAndNew(interaction, modifyUser, oldScore, oldTotalScore, newScore, newTotalScore);
	}

	private async handleSetTotalCommand(provider: DependencyProvider, interaction: ChatInputCommandInteraction, modifyUser: User, recommendation: number) {
		const databaseClient = provider.get(DatabaseClient);
		const recommendationHelper = provider.get(RecommendationHelper);
		const timeHelper = provider.get(TimeHelper);

		const userData = await databaseClient.userRepository.get(modifyUser.id);
		const oldScore = recommendationHelper.getRecommendationScore(userData);
		const oldTotalScore = userData.totalRecommendationScore;
		userData.totalRecommendationScore = recommendation;
		userData.recommendationScore = Math.min(oldScore, recommendation);
		userData.lastRecommendationScoreUpdate = timeHelper.currentDate;
		await databaseClient.userRepository.updateRecommendationScore(userData);
		await recommendationHelper.updateRecommendationRole(userData);
		const newScore = recommendationHelper.getRecommendationScore(userData);
		const newTotalScore = userData.totalRecommendationScore;

		await this.replyWithOldAndNew(interaction, modifyUser, oldScore, oldTotalScore, newScore, newTotalScore);
	}

	private async handleViewCommand(provider: DependencyProvider, interaction: ChatInputCommandInteraction, viewUser: User) {
		const databaseClient = provider.get(DatabaseClient);
		const recommendationHelper = provider.get(RecommendationHelper);

		const userData = await databaseClient.userRepository.get(viewUser.id);
		const score = recommendationHelper.getRecommendationScore(userData);
		const totalScore = userData.totalRecommendationScore;

		await interaction.editReply({
			embeds: [
				new EmbedBuilder()
					.setColor(constants.mainColor)
					.setThumbnail(viewUser.displayAvatarURL({size: 32}))
					.setTitle(`${viewUser.displayName}'${/[sz]$/g.test(viewUser.displayName) ? "" : "s"} recommendation`)
					.addFields(utils.fieldsInColumns([
						{name: "Recommendation", value: Math.round(score).toString()},
						{name: "Total recommendation", value: Math.round(totalScore).toString()},
					], 2))
					.toJSON()
			]
		});
	}

	private async replyWithOldAndNew(interaction: ChatInputCommandInteraction, user: User, oldScore: number, oldTotalScore: number, newScore: number, newTotalScore: number) {
		await interaction.editReply({
			embeds: [
				new EmbedBuilder()
					.setColor(constants.mainColor)
					.setThumbnail(user.displayAvatarURL({size: 32}))
					.setTitle(`Modified ${user.displayName}`)
					.addFields(utils.fieldsInColumns([
						{name: "Old recommendation", value: Math.round(oldScore).toString()},
						{name: "Old total recommendation", value: Math.round(oldTotalScore).toString()},
						{name: "New recommendation", value: Math.round(newScore).toString()},
						{name: "New total recommendation", value: Math.round(newTotalScore).toString()},
					], 2))
					.toJSON()
			]
		})
	}
}

export default new ImpersonateCommand();