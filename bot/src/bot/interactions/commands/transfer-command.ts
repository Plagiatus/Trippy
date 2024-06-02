import { EmbedBuilder } from "discord.js";
import DatabaseClient from "../../../database-client";
import DatabaseLegacyClient from "../../../database-client-legacy";
import RecommendationHelper from "../../../recommendation-helper";
import injectDependency from "../../../shared/dependency-provider/inject-dependency";
import TimeHelper from "../../../time-helper";
import DiscordClient from "../../discord-client";
import ErrorHandler from "../../error-handler";
import Command, { CommandExecutionContext } from "./command";
import constants from "../../../utils/constants";
import utils from "../../../utils/utils";
import ModLogMessages from "../messages/mod-log-messages";

class TransferCommand extends Command {
	private readonly errorHandler = injectDependency(ErrorHandler);
	
	public constructor() {
		super("transfer");
	}

	public create() {
		return this.buildBaseCommand()
			.setDescription("Transfers old data to new bot.")
			.addSubcommand(subCommand => 
				subCommand.setName("xp")
					.setDescription("Transfers your old XP into Recommendation.")
			);
	}

	public async handleExecution({ provider, interactor, interaction }: CommandExecutionContext) {
		await interaction.deferReply({ ephemeral: true });
		let dbClient = provider.get(DatabaseLegacyClient);
		try {
			await interaction.editReply("Fetching old data...");
			const legacyUser = await dbClient.userRepository.get(interactor.id);
			if (!legacyUser) {
				await interaction.editReply("No old data found. Nothing to transfer.");
				return;
			}
			if (legacyUser.transferredXP) {
				await interaction.editReply("You already transferred your data.");
				return;
			}

			const users = provider.get(DatabaseClient).userRepository;
			const user = await users.get(interactor.id);
			if(!user) {
				await interaction.editReply("You aren't registered with this bot yet, please do that before you try to transfer.");
				return;
			}

			const recommendationHelper = provider.get(RecommendationHelper);
			const timeHelper = provider.get(TimeHelper);
			const oldScore = recommendationHelper.getRecommendationScore(user);
			const oldTotalScore = user.totalRecommendationScore;
			const legacyXP = legacyUser.experience;
			
			let newTotalScore = oldTotalScore + legacyXP;
			let newScore = oldScore + Math.min(legacyXP * 0.1, 500);

			user.totalRecommendationScore = newTotalScore;
			user.recommendationScore = newScore;
			user.lastRecommendationScoreUpdate = timeHelper.currentDate;
			await users.updateRecommendationScore(user);
			await recommendationHelper.updateRecommendationRole(user);
			await dbClient.userRepository.setTransferred(interactor.id, true);
			await interaction.editReply({
				embeds: [
					new EmbedBuilder()
						.setTitle("Success! Your XP was successfully transferred.")
						.addFields(utils.fieldsInColumns([
							{name: "Old recommendation", value: Math.round(oldScore).toString()},
							{name: "Old total recommendation", value: Math.round(oldTotalScore).toString()},
							{name: "New recommendation", value: Math.round(newScore).toString()},
							{name: "New total recommendation", value: Math.round(newTotalScore).toString()},
						], 2))
				],
				content: ""				
			});
			await ModLogMessages.transfer(provider, interactor, {oldScore, oldTotalScore, legacyXP, newTotalScore, newScore});
		} catch (error: any) {
			await interaction.editReply("Something unexpected went wrong when transferring. Please try again or let a moderator know if this issue persists.");
			this.errorHandler.handleGenericError(error);
		}
	}
}

export default new TransferCommand();