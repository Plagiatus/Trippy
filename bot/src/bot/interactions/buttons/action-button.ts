import { ButtonBuilder, ButtonInteraction, GuildMember } from "discord.js";
import DependencyProvider from "../../../shared/dependency-provider/dependency-provider";

export default abstract class ActionButton<TId extends string = string> {
	public constructor(private readonly buttonId: TId) {

	}

	public abstract handleClick(context: ButtonClickContext<TId>): void|Promise<void>;

	public isButtonId(id: string): false|Record<ButtonParametersFromId<TId>,string> {
		const regExp = this.buildIdRegExp();
		const result = regExp.exec(id);
		if (!result) {
			return false;
		}

		const parameterNames = this.getParameterNames();
		const givenArguments: Record<string,string> = {};
		for (let i = 1; i < result.length; i++) {
			const parameterName = parameterNames[i - 1];
			const argument = result[i];
			givenArguments[parameterName] = argument;
		}
		return givenArguments as Record<ButtonParametersFromId<TId>,string>;
	}

	private buildIdRegExp(): RegExp {
		let regexString = "^";

		const idParts = this.getIdParts();
		for (const part of idParts) {
			if (part.isParameter) {
				regexString += "(.*)";
			} else {
				regexString += part.name;
			}
		}

		return new RegExp(regexString + "$");
	}

	private getParameterNames() {
		return this.getIdParts().filter(part => part.isParameter).map(part => part.name);
	}

	private getIdParts() {
		const parsedParts: Array<{isParameter: boolean, name: string}> = [];
		const stringParts = this.buttonId.split(new RegExp("\\(([^)]*)\\)"));
		for (let i = 0; i < stringParts.length; i++) {
			if (i % 2 === 0) {
				parsedParts.push({isParameter: false, name: stringParts[i]});
			} else {
				parsedParts.push({isParameter: true, name: stringParts[i]});
			}
		}
		return parsedParts;
	}

	protected createBaseButton(idParameters: Record<ButtonParametersFromId<TId>,string>) {
		let buttonId = "";
		
		const idParts = this.getIdParts();
		for (const part of idParts) {
			if (part.isParameter) {
				const parameter = idParameters[part.name as ButtonParametersFromId<TId>];
				buttonId += parameter;
			} else {
				buttonId += part.name;
			}
		}

		return new ButtonBuilder()
			.setCustomId(buttonId);
	}
}

export type ButtonClickContext<TId extends string> = {
	buttonParameters: Record<ButtonParametersFromId<TId>,string>,
	interaction: ButtonInteraction,
	provider: DependencyProvider,
	interactor: GuildMember,
}

export type ButtonParametersFromId<TId extends string> = TId extends `${infer TChar extends string}${infer TRest extends string}`
	?	TChar extends "("
		?	ParseParamter<TRest, "">
		:	ButtonParametersFromId<TRest>
	:	never;

type ParseParamter<TPartOfId extends string, TParsedParameter extends string> = TPartOfId extends `${infer TChar extends string}${infer TRest extends string}`
	?	TChar extends ")"
		?	TParsedParameter|ButtonParametersFromId<TRest>
		:	ParseParamter<TRest, `${TParsedParameter}${TChar}`>
	:	 never;