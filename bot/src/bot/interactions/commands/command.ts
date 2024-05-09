import { ChatInputCommandInteraction, GuildMember, SlashCommandBuilder} from "discord.js";
import DependencyProvider from "../../../shared/dependency-provider/dependency-provider";

export default abstract class Command {
	public constructor(public readonly name: string) {

	}

	public abstract create(context: CommandCreationContext): Omit<SlashCommandBuilder,`${"add"|"set"}${string}`> | Promise<Omit<SlashCommandBuilder,`${"add"|"set"}${string}`>>;

	public isCommandName(commandName: string): boolean {
		return this.name === commandName;
	}

	protected buildBaseCommand() {
		return new SlashCommandBuilder()
			.setName(this.name);
	}

	public abstract handleExecution(context: CommandExecutionContext): void | Promise<void>;
}

export type CommandCreationContext = {
	provider: DependencyProvider;
}

export type CommandExecutionContext = {
	interaction: ChatInputCommandInteraction;
	provider: DependencyProvider;
	interactor: GuildMember;
	getMemberOption: (name: string) => Promise<GuildMember|null>;
}