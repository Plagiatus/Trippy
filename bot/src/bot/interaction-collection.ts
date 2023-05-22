import { ButtonInteraction, CommandInteraction, ContextMenuCommandInteraction, ModalSubmitInteraction } from "discord.js";
import utils from "../utils/utils";
import { IBasicInteraction, IButtonInteraction, ICommandInteraction, IContextMenuInteraction, IModalInteraction } from "./interaction-types";
import Provider from "../provider";

export default class InteractionCollection {
	public readonly commandInteractions: Map<string,ICommandInteraction>;
	public readonly buttonInteractions: Map<string,IButtonInteraction>;
	public readonly contextInteractions: Map<string,IContextMenuInteraction>;
	public readonly modalInteractions: Map<string,IModalInteraction>;

	public constructor(private readonly provider: Provider, private readonly interactions: ReadonlyArray<IBasicInteraction>) {
		this.commandInteractions = this.getInteractionsOfType<ICommandInteraction>("COMMAND");
		this.buttonInteractions = this.getInteractionsOfType<IButtonInteraction>("BUTTON");
		this.contextInteractions = this.getInteractionsOfType<IContextMenuInteraction>("CONTEXT");
		this.modalInteractions = this.getInteractionsOfType<IModalInteraction>("MODAL");
	}

	private getInteractionsOfType<T extends IBasicInteraction>(type: T["type"]) {
		const interactionsOfType = this.interactions.filter(interaction => interaction.type === type);
		const namesAndInteractions = interactionsOfType.map(interaction => [interaction.name,interaction as T] as const);
		const interactionMap = new Map(namesAndInteractions);
		return interactionMap;
	}

	public executeCommandInteraction(id: string, interaction: CommandInteraction) {
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

	private executeInteraction<T extends IBasicInteraction>(map: Map<string,T>, id: string, interaction: Parameters<T["execute"]>[0]["interaction"]) {
		const executer = map.get(id);
		if (!executer) {
			throw new Error(`This interaction ("${id}") doesn't exist. Please contact a moderator if this problem persists.`);
		}

		executer.execute({
			interaction,
			provider: this.provider,
		});
	}

	public static importInteractions() {
		const routeFiles = utils.dynamicImportFolder<IBasicInteraction>("bot/interactions");
		return routeFiles.flatMap(routeFile => routeFile.imported);
	}
}