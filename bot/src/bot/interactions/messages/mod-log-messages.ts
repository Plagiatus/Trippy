import { GuildMember, User } from "discord.js";
import DependencyProvider from "../../../shared/dependency-provider/dependency-provider";
import DiscordClient from "../../discord-client";

export default class ModLogMessages {
    public static async ban(provider: DependencyProvider, banner: GuildMember, banned: User) {
		const discordClient = provider.get(DiscordClient);
        await discordClient.sendMessage("modLog", {
			content: `${banner.toString()} just banned ${banned.toString()} from their sessions.`,
		});
	}
    public static async unban(provider: DependencyProvider, banner: GuildMember, unbanned: User) {
		const discordClient = provider.get(DiscordClient);
        await discordClient.sendMessage("modLog", {
			content: `${banner.toString()} just unbanned ${unbanned.toString()}, they can join their sessions again.`,
		});
	}
    public static async kick(provider: DependencyProvider, host: GuildMember, kicked: User) {
		const discordClient = provider.get(DiscordClient);
        await discordClient.sendMessage("modLog", {
			content: `${host.toString()} just kicked ${kicked.toString()} from their session.`,
		});
	}
	public static async transfer(provider: DependencyProvider, transferee: GuildMember, stats: any){
		const discordClient = provider.get(DiscordClient);
		await discordClient.sendMessage("modLog", {
			content: `${transferee.toString()} just transferred their XP.\n` + "```json\n" + JSON.stringify(stats, undefined, 2) + "```",
		});
	}
}