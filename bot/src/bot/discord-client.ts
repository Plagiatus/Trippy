import Config from "../config";
import Provider from "../provider";
import * as Discord from "discord.js";
import ErrorHandler from "./error-handler";
import InteractionCollection from "./interaction-collection";

type ChannelParameterType = (keyof Config["channelIds"]) | (string & {}) | Discord.Channel;
export default class DiscordClient {
	private readonly client: Discord.Client;
	private readonly config: Config;
	private readonly errorHandler: ErrorHandler;
	private readonly interactionCollection: InteractionCollection;

	public constructor(private readonly provider: Provider) {
		this.config = provider.get(Config);
		this.errorHandler = provider.get(ErrorHandler);
		this.interactionCollection = provider.get(InteractionCollection);
		this.client = new Discord.Client({ intents: [Discord.GatewayIntentBits.Guilds] });
		this.addListeners();
	}

	private get user() {
		if (this.client.user) {
			return this.client.user;
		}

		throw new Error("Discord client doesn't have a user.");
	}

	public get allowAccessToChannelPermissions() {
		return {
			id: this.user.id,
			allow: ["ViewChannel"]
		} satisfies Discord.OverwriteResolvable
	}

	public async connect() {
		return new Promise<void>(res => {
			this.client.once("ready", () => res());
			this.client.login(this.provider.get(Config).discordApiToken);
		});
	}

	public async sendMessage(channel: ChannelParameterType, message: string|Discord.MessagePayload|Discord.BaseMessageOptions) {
		const sendInChannel = await this.getChannel(channel);

		if (!sendInChannel || !sendInChannel.isTextBased()) {
			throw new Error("Failed to find channel to send message in.");
		}
		return await sendInChannel.send(message);
	}

	public async getMessage(channel: ChannelParameterType, id: string) {
		const fetchFromChannel = await this.getChannel(channel);
		if (fetchFromChannel && fetchFromChannel.isTextBased()) {
			return await fetchFromChannel.messages.fetch(id);
		}
		return undefined;
	}

	public async getChannel(channel: ChannelParameterType) {
		try {
			const guild = await this.getGuild();

			if (typeof channel === "string") {
				if (channel in this.config.channelIds) {
					const channelId = this.config.channelIds[channel as keyof Config["channelIds"]];
					return await guild.channels.fetch(channelId);
				}
				return await guild.channels.fetch(channel);
			}

			return channel;
		} catch {
			return null;
		}
	}

	public async createChannel<T extends Discord.GuildChannelTypes>(options: Discord.GuildChannelCreateOptions & { type: T }) {
		const guild = await this.getGuild();
		return await guild.channels.create(options);
	}

	public async deleteChannel(id: string) {
		const guild = await this.getGuild();
		await guild.channels.delete(id);
	}

	public async getRole(id: string) {
		const guild = await this.getGuild();
		return await guild.roles.fetch(id);
	}

	public async createRole(options: Discord.RoleCreateOptions) {
		const guild = await this.getGuild();
		return await guild.roles.create(options);
	}

	public async getMember(id: string) {
		try {
			const guild = await this.getGuild();
			return await guild.members.fetch(id);
		} catch {
			return null;
		}
	}

	public async validateGuildIsSetup() {
		const guild = await this.validateGuildExists(this.config.guildId);
		await Promise.all([
			this.validateChannelsExists(guild, this.config.channelIds),
			this.validateRolesExists(guild, this.config.roleIds),
		]);
	}

	private async validateGuildExists(guildId: string) {
		await this.client.guilds.fetch()
		let guild = this.client.guilds.cache.get(guildId);
		if (!guild) throw new Error("Specified guild not found.");
		return guild;
	}

	private async validateChannelsExists(guild: Discord.Guild, channels: Readonly<Record<string,string>>) {
		await guild.channels.fetch();
		for (const [name,id] of Object.entries(channels)) {
			if (!guild.channels.cache.has(id)) {
				throw new Error(`Channel "${name}" ("${id}") not found in guild.`);
			}

			const perms = guild.channels.cache.get(id)?.permissionsFor(this.user);
			if (!perms?.has("SendMessages") || !perms.has("ViewChannel")) {
				throw new Error(`Channel "${name}" ("${id}") doesn't have correct permissions.`);
			}
		}
	}

	private async validateRolesExists(guild: Discord.Guild, roles: Readonly<Record<string,string>>) {
		await guild.roles.fetch();
		for (const [name,id] of Object.entries(roles)) {
			if (!guild.roles.cache.has(id)) {
				throw new Error(`Role "${name}" ("${id}") not found in guild.`);
			}
		}
	}

	private addListeners() {
		this.client.on("interactionCreate", this.handleInteraction.bind(this));
		this.client.on("error", error => this.errorHandler.handleGenericError(error));
	}

	private handleInteraction(interaction: Discord.Interaction) {
		try {
			this.executeInteraction(interaction);
		} catch (error) {
			this.errorHandler.handleInteractionError(error, interaction);
		}
	}
	
	private async executeInteraction(interaction: Discord.Interaction) {
		if (interaction.isChatInputCommand()) {
			this.interactionCollection.executeCommandInteraction(interaction.commandName, interaction);
		} else if (interaction.isButton()) {
			this.interactionCollection.executeButtonInteraction(interaction.customId, interaction);
		} else if (interaction.isContextMenuCommand()) {
			this.interactionCollection.executeContextInteraction(interaction.commandName, interaction);
		} else if (interaction.type === Discord.InteractionType.ModalSubmit) {
			this.interactionCollection.executeModalInteraction(interaction.customId, interaction);
		} else {
			throw new Error("This type of interaction is not supported. If this problem persists, contact a moderator.");
		}
	}

	private async getGuild() {
		return await this.client.guilds.fetch(this.config.guildId);
	}
}