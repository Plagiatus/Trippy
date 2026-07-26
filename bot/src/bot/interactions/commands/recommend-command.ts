import { EmbedBuilder } from "discord.js";
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
		const recommendationHelper = provider.get(RecommendationHelper);
		const timeHelper = provider.get(TimeHelper);
		
		const dontAnnounce = interaction.options.getBoolean("privately") ?? false;
		await interaction.deferReply({ephemeral: dontAnnounce});

		const recommendUser = await getMemberOption("user");
		if (!recommendUser) {
			interaction.editReply({content: "Can't find the user to recommend."});
			return;
		}

		const result = await recommendationHelper.makeUserRecommendUser({ user: interactor, recommendUser: recommendUser });
		if (!result.success) {
			switch (result.error) {
				case "self":
					interaction.editReply({content: "You can't recommend yourself."});
					return;
				case "user-not-found":
					interaction.editReply({content: "Can't find the user to recommend."});
					return;
				case "cooldown":
					if (result.millisecondsBeforeBeingAbleToRecommendAny) {
						interaction.editReply(`${interactor}, you can first recommend ${recommendUser} or anyone else again ${timeHelper.formatCountdown(Math.max(result.millisecondsBeforeBeingAbleToRecommendUser ?? 0, result.millisecondsBeforeBeingAbleToRecommendAny ?? 0))}.`);
					} else {
						interaction.editReply(`${interactor}, you can first recommend ${recommendUser} again ${timeHelper.formatCountdown(result.millisecondsBeforeBeingAbleToRecommendUser ?? 0)}.`);
					}
					return;
				case "not-allowed":
					interaction.editReply(`${interactor}, you are not yet allowed to recommend ${recommendUser} or anyone else.`);
					return;
				default:
					interaction.editReply({content: "Unable to recommend the selected user."});
					return;
			}
		}

		interaction.editReply({
			embeds: [
				new EmbedBuilder()
					.setAuthor({
						name: interactor.displayName,
						iconURL: interactor.user.displayAvatarURL(),
					})
					.setThumbnail(recommendUser.displayAvatarURL({size: 64}))
					.setDescription(`Recommended ${recommendUser}.`)
					.setColor(constants.mainColor)
					.toJSON(),
			]
		});
	}
}

export default new RecommendCommand();