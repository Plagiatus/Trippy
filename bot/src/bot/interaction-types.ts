import type Provider from "../provider";
import type { BaseInteraction, ButtonBuilder, ModalBuilder, ModalSubmitInteraction, ContextMenuCommandInteraction, ButtonInteraction, CommandInteraction, ContextMenuCommandBuilder, SlashCommandBuilder } from "discord.js"

export type Interaction = IButtonInteraction | ICommandInteraction | IContextMenuInteraction | IModalInteraction;

export interface IBasicInteraction<TInteraction extends BaseInteraction = any, TType extends string = any> {
	type: TType
	execute: (args: {interaction: TInteraction, provider: Provider}) => void,
	name: string,
}

export interface IButtonInteraction extends IBasicInteraction<ButtonInteraction, "BUTTON"> {
	data: ButtonBuilder,
}

export interface ICommandInteraction extends IBasicInteraction<CommandInteraction, "COMMAND"> {
	data: SlashCommandBuilder,
}

export interface IContextMenuInteraction extends IBasicInteraction<ContextMenuCommandInteraction, "CONTEXT"> {
	data: ContextMenuCommandBuilder,
}

export interface IModalInteraction extends IBasicInteraction<ModalSubmitInteraction, "MODAL"> {
	data: ModalBuilder,
}
