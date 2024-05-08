import { VoiceChannel, ChannelType } from "discord.js";
import Config from "../../config";
import Provider from "../../shared/provider/provider";
import { VoiceChannelBlueprint } from "../../shared/types/session-blueprint-types";
import utils from "../../utils/utils";
import DiscordClient from "../discord-client";
import Session from "../../session/session";
import { SessionVoiceChannelsData } from "../../types/document-types";

export default class SessionVoiceChannels {
	private readonly discordClient: DiscordClient;
	private readonly config: Config;

	private constructor(provider: Provider, private readonly channels: VoiceChannel[], private readonly categoryChannelId: string) {
		this.discordClient = provider.get(DiscordClient);
		this.config = provider.get(Config);
	}

	public get data(): SessionVoiceChannelsData {
		return {
			categoryChannelId: this.categoryChannelId,
			channelIds: this.channels.map(channel => channel.id),
		}
	}

	public isVoiceChannelId(id: string) {
		return this.channels.some(channel => channel.id === id);
	}

	public static async recreate(provider: Provider, session: Session, data: SessionVoiceChannelsData) {
		const discordClient = provider.get(DiscordClient);
		const voiceChannels = await utils.asyncMap(data.channelIds, async (id) => {
			const channel = await discordClient.getChannel(id);
			if (!channel || channel.type !== ChannelType.GuildVoice) {
				throw new Error("Unable to recreate because one or more voice channels couldn't be found.");
			}
			return channel;
		});

		const channels = new SessionVoiceChannels(provider, voiceChannels, data.categoryChannelId);
		await channels.update(session);
		return channels;
	}

	public static async createNew(provider: Provider, session: Session, categoryChannelId: string, sessionRoleId: string) {
		const discordClient = provider.get(DiscordClient);
		const config = provider.get(Config);

		const blueprints = session.blueprint.voiceChannels ?? [];
		const voiceChannels = await utils.asyncMap(blueprints, async (blueprint, index) => {
			return await SessionVoiceChannels.createVoiceChannel(discordClient, config, session, categoryChannelId, blueprint, index, sessionRoleId)
		});

		return new SessionVoiceChannels(provider, voiceChannels, categoryChannelId);
	}

	public async update(session: Session) {
		const blueprints = session.blueprint.voiceChannels ?? [];
		await this.removeExtraVoiceChannels(blueprints.length);
		await this.addExtraVoiceChannels(session, blueprints);
		
		await utils.asyncForeach(blueprints, async (blueprint, index) => {
			await this.updateVoiceChannel(this.channels[index], blueprint, index);
		});
	}

	public async remove() {
		await utils.asyncForeach(this.channels, async (channel) => {
			await channel.delete();
		});
	}

	private async addExtraVoiceChannels(session: Session, newVoiceChannelsArray: VoiceChannelBlueprint[]) {
		if (newVoiceChannelsArray.length <= this.channels.length) {
			return;
		}

		const missingChannels = newVoiceChannelsArray.slice(this.channels.length);
		const newChannels = await utils.asyncMap(missingChannels, async (blueprint, index) => {
			return await SessionVoiceChannels.createVoiceChannel(this.discordClient, this.config, session, this.categoryChannelId, blueprint, index + this.channels.length);
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

	private async updateVoiceChannel(channel: VoiceChannel, blueprint: VoiceChannelBlueprint, index: number) {
		const newChannelName = SessionVoiceChannels.getVoiceChannelName(blueprint, index);
		if (channel.name !== newChannelName) {
			await channel.setName(newChannelName);
		}
	}

	private static async createVoiceChannel(discordClient: DiscordClient, config: Config, session: Session, categoryChannelId: string, blueprint: VoiceChannelBlueprint, index: number, sessionRoleId?: string) {
		return await discordClient.createChannel({
			type: ChannelType.GuildVoice,
			name: SessionVoiceChannels.getVoiceChannelName(blueprint, index),
			parent: categoryChannelId,
			permissionOverwrites: [
				{
					id: config.guildId,
					deny: ["ViewChannel"]
				},
				{
					id: sessionRoleId ?? session.roleId,
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