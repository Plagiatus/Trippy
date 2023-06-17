import type Provider from "../provider";
import type { BaseInteraction, ButtonBuilder, ModalBuilder, ModalSubmitInteraction, ContextMenuCommandInteraction, ButtonInteraction, ContextMenuCommandBuilder, SlashCommandBuilder, ChatInputCommandInteraction, GuildMember } from "discord.js"

export type Interaction = IButtonInteraction<any> | ICommandInteraction | IContextMenuInteraction | IModalInteraction;

export interface IBasicInteraction<TInteraction extends BaseInteraction = any, TType extends string = any> {
	type: TType
	execute: (args: {interaction: TInteraction, provider: Provider, interactor: GuildMember}) => void,
	name: string|RegExp,
}

export interface IButtonInteraction<TParams extends any[]> extends IBasicInteraction<ButtonInteraction, "BUTTON"> {
	create: (...args: TParams) => ButtonBuilder,
}

export interface ICommandInteraction extends IBasicInteraction<ChatInputCommandInteraction, "COMMAND"> {
	data: Omit<SlashCommandBuilder,`add${string}`>,
}

export interface IContextMenuInteraction extends IBasicInteraction<ContextMenuCommandInteraction, "CONTEXT"> {
	data: ContextMenuCommandBuilder,
}

export interface IModalInteraction extends IBasicInteraction<ModalSubmitInteraction, "MODAL"> {
	data: ModalBuilder,
}
