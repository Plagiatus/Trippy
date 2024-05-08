import { GuildMember, User } from "discord.js";
import Provider from "../../../shared/provider/provider";
import DiscordClient from "../../discord-client";

export default class ModLogMessages {
    public static async ban(provider: Provider, banner: GuildMember, banned: User) {
		const discordClient = provider.get(DiscordClient);
        await discordClient.sendMessage("modLog", {
			content: `${banner.toString()} just banned ${banned.toString()} from their sessions.`,
		});
	}
    public static async unban(provider: Provider, banner: GuildMember, unbanned: User) {
		const discordClient = provider.get(DiscordClient);
        await discordClient.sendMessage("modLog", {
			content: `${banner.toString()} just unbanned ${unbanned.toString()}, they can join their sessions again.`,
		});
	}
    public static async kick(provider: Provider, host: GuildMember, kicked: User) {
		const discordClient = provider.get(DiscordClient);
        await discordClient.sendMessage("modLog", {
			content: `${host.toString()} just kicked ${kicked.toString()} from their session.`,
		});
	}
}