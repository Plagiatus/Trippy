import { ButtonInteraction, ChatInputCommandInteraction, CommandInteraction, ContextMenuCommandInteraction, ModalSubmitInteraction } from "discord.js";
import utils from "../utils/utils";
import { IBasicInteraction, IButtonInteraction, ICommandInteraction, IContextMenuInteraction, IModalInteraction } from "./interaction-types";
import Provider from "../provider";

export default class InteractionCollection {
	public readonly commandInteractions: Map<string|RegExp,ICommandInteraction>;
	public readonly buttonInteractions: Map<string|RegExp,IButtonInteraction<any>>;
	public readonly contextInteractions: Map<string|RegExp,IContextMenuInteraction>;
	public readonly modalInteractions: Map<string|RegExp,IModalInteraction>;

	public constructor(private readonly provider: Provider, private readonly interactions: ReadonlyArray<IBasicInteraction>) {
		this.commandInteractions = this.getInteractionsOfType<ICommandInteraction>("COMMAND");
		this.buttonInteractions = this.getInteractionsOfType<IButtonInteraction<any>>("BUTTON");
		this.contextInteractions = this.getInteractionsOfType<IContextMenuInteraction>("CONTEXT");
		this.modalInteractions = this.getInteractionsOfType<IModalInteraction>("MODAL");
	}

	private getInteractionsOfType<T extends IBasicInteraction>(type: T["type"]) {
		const interactionsOfType = this.interactions.filter(interaction => interaction.type === type);
		const namesAndInteractions = interactionsOfType.map(interaction => [interaction.name,interaction as T] as const);
		const interactionMap = new Map(namesAndInteractions);
		return interactionMap;
	}

	public executeCommandInteraction(id: string, interaction: ChatInputCommandInteraction) {
		this.executeInteraction(this.commandInteractions, id, interaction);
	}

	public executeButtonInteraction(id: string, interaction: ButtonInteraction) {
		this.executeInteraction(this.buttonInteractions, id, interaction);
	}

	public executeContextInteraction(id: string, interaction: ContextMenuCommandInteraction) {
		this.executeInteraction(this.contextInteractions, id, interaction);
	}

	public executeModalInteraction(id: string, interaction: ModalSubmitInteraction) {
		this.executeInteraction(this.modalInteractions, id, interaction);
	}

	private executeInteraction<T extends IBasicInteraction>(map: Map<string|RegExp,T>, id: string, interaction: Parameters<T["execute"]>[0]["interaction"]) {
		const executer = this.getExecuterFromId(map, id);

		executer.execute({
			interaction,
			provider: this.provider,
		});
	}

	private getExecuterFromId<T extends IBasicInteraction>(map: Map<string|RegExp,T>, id: string) {
		const foundById = map.get(id);
		if (foundById) {
			return foundById;
		}

		for (const key of map.keys()) {
			if (key instanceof RegExp && key.exec(id)) {
				return map.get(key)!;
			}
		}

		throw new Error(`This interaction ("${id}") doesn't exist. Please contact a moderator if this problem persists.`);
	}

	public static importInteractions() {
		const routeFiles = utils.dynamicImportFolder<IBasicInteraction>("bot/interactions");
		return routeFiles.flatMap(routeFile => routeFile.imported);
	}
}