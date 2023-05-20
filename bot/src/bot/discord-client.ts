import Config from "../config";
import Provider from "../provider";
import * as Discord from "discord.js";
import ErrorHandler from "./error-handler";
import InteractionCollection from "./interaction-collection";

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

    public async connect() {
        return new Promise<void>(res => {
            this.client.once("ready", () => res());
            this.client.login(this.provider.get(Config).discordApiToken);
        });
    }

    public async sendMessage(channelType: keyof Config["channelIds"], message: string|Discord.MessagePayload|Discord.MessageOptions) {
        const guild = await this.client.guilds.fetch(this.config.guildId);
		const channel = await guild.channels.fetch(this.config.channelIds[channelType]);

        if (channel && channel.type == Discord.ChannelType.GuildText) {
            await channel.send(message);
            return true;
		}
        return false;
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
}