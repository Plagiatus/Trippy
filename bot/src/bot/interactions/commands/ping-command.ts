import TimeHelper from "../../../time-helper";
import Command, { CommandExecutionContext } from "./command";

class PingCommand extends Command {
	public constructor() {
		super("ping");
	}

	public create() {
		return this.buildBaseCommand()
			.setDescription("Replies if the bot is online.");
	}

	public handleExecution({interaction, provider}: CommandExecutionContext) {
		const latency = provider.get(TimeHelper).currentDate.getTime() - interaction.createdTimestamp;
		interaction.reply({ephemeral: true, content: `Ping Pong, my latency is long! (${latency}ms)`});
	}
}

export default new PingCommand();