import { ChatInputCommandInteraction, GuildMember, SlashCommandBuilder, User } from "discord.js";
import Provider from "../../../shared/provider/provider";

export default abstract class Command {
	public constructor(public readonly name: string) {

	}

	public abstract create(context: CommandCreationContext): Omit<SlashCommandBuilder,`add${string}`> | Promise<Omit<SlashCommandBuilder,`add${string}`>>;

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
	provider: Provider;
}

export type CommandExecutionContext = {
	interaction: ChatInputCommandInteraction;
	provider: Provider;
	interactor: GuildMember;
	getMemberOption: (name: string) => Promise<GuildMember|null>;
}