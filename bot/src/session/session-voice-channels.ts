import DiscordClient from "../bot/discord-client";
import Provider from "../provider";
import * as Discord from "discord.js";
import { SessionBlueprint, VoiceChannelBlueprint } from "../types/session-blueprint-types";
import utils from "../utils/utils";
import Config from "../config";

export default class SessionVoiceChannels {
	private readonly discordClient: DiscordClient;
	private readonly config: Config;

	private constructor(provider: Provider, private readonly categoryChannel: Discord.CategoryChannel, private readonly channels: Discord.VoiceChannel[], private readonly sessionRole: Discord.Role) {
		this.discordClient = provider.get(DiscordClient);
		this.config = provider.get(Config);
	}

	public get channelIds() {
		return this.channels.map(channel => channel.id);
	}

	public static async recreate(provider: Provider, category: Discord.CategoryChannel, sessionRole: Discord.Role, channelIds: string[], sessionBlueprint: SessionBlueprint) {
		const discordClient = provider.get(DiscordClient);
		const voiceChannels = await utils.asyncMap(channelIds, async (id) => {
			const channel = await discordClient.getChannel(id);
			if (!channel || channel.type !== Discord.ChannelType.GuildVoice) {
				throw new Error("Unable to recreate because one or more voice channels couldn't be found.");
			}
			return channel;
		});

		const channels = new SessionVoiceChannels(provider, category, voiceChannels, sessionRole);
		await channels.update(sessionBlueprint);
		return channels;
	}

	public static async createNew(provider: Provider, category: Discord.CategoryChannel, sessionBlueprint: SessionBlueprint, sessionRole: Discord.Role) {
		const discordClient = provider.get(DiscordClient);
		const config = provider.get(Config);

		const blueprints = sessionBlueprint.voiceChannels ?? [];
		const voiceChannels = await utils.asyncMap(blueprints, async (blueprint, index) => {
			return await SessionVoiceChannels.createVoiceChannel(discordClient, config, category, sessionRole, blueprint, index)
		});

		return new SessionVoiceChannels(provider, category, voiceChannels, sessionRole);
	}

	public async update(sessionBlueprint: SessionBlueprint) {
		const blueprints = sessionBlueprint.voiceChannels ?? [];
		await this.removeExtraVoiceChannels(blueprints.length);
		await this.addExtraVoiceChannels(blueprints);
		
		await utils.asyncForeach(blueprints, async (blueprint, index) => {
			await this.updateVoiceChannel(this.channels[index], blueprint, index);
		});
	}

	public async remove() {
		await utils.asyncForeach(this.channels, async (channel) => {
			await channel.delete();
		});
	}

	private async addExtraVoiceChannels(newVoiceChannelsArray: VoiceChannelBlueprint[]) {
		if (newVoiceChannelsArray.length <= this.channels.length) {
			return;
		}

		const missingChannels = newVoiceChannelsArray.slice(this.channels.length);
		const newChannels = await utils.asyncMap(missingChannels, async (blueprint, index) => {
			return await SessionVoiceChannels.createVoiceChannel(this.discordClient, this.config, this.categoryChannel, this.sessionRole, blueprint, index + this.channels.length);
		});

		this.channels.push(...newChannels);
	}

	private async removeExtraVoiceChannels(totalChannelCount: number) {
		if (totalChannelCount >= this.channels.length) {
			return;
		}

		const channelsToRemove = this.channels.splice(totalChannelCount);

		await utils.asyncForeach(channelsToRemove, async (channel) => {
			await this.discordClient.deleteChannel(channel.id);
		});
	}

	private async updateVoiceChannel(channel: Discord.VoiceChannel, blueprint: VoiceChannelBlueprint, index: number) {
		const newChannelName = SessionVoiceChannels.getVoiceChannelName(blueprint, index);
		if (channel.name !== newChannelName) {
			await channel.setName(newChannelName);
		}
	}

	private static async createVoiceChannel(discordClient: DiscordClient, config: Config, category: Discord.CategoryChannel, sessionRole: Discord.Role, blueprint: VoiceChannelBlueprint, index: number) {
		return await discordClient.createChannel({
			type: Discord.ChannelType.GuildVoice,
			name: SessionVoiceChannels.getVoiceChannelName(blueprint, index),
			parent: category.id,
			permissionOverwrites: [
				{
					id: config.guildId,
					deny: ["ViewChannel"]
				},
				{
					id: sessionRole.id,
					allow: ["ViewChannel"]
				},
				discordClient.allowAccessToChannelPermissions,
			]
		});
	}

	private static getVoiceChannelName(blueprint: VoiceChannelBlueprint, index: number) {
		if (blueprint.name) {
			return blueprint.name;
		}

		return `vc-${index+1}`;
	}
}