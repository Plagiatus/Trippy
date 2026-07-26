import SessionsCollection from "./session/sessions-collection";
import injectDependency from "./shared/dependency-provider/inject-dependency";
import { GuildMember } from "discord.js";
import DiscordClient from "./bot/discord-client";
import Session from "./session/session";
import { KickResultDto } from "./shared/types/dto-types";
import Config from "./config";

export default class KickHelper {
	private readonly sessionsCollection = injectDependency(SessionsCollection);
	private readonly discordClient = injectDependency(DiscordClient);
	private readonly config = injectDependency(Config);

	public async makeUserKickUser(options: { session: string | Session, user: string | GuildMember, kickUser: string | GuildMember, softly?: boolean }): Promise<KickResultDto> {
		const session = typeof options.session === "string" ? this.sessionsCollection.getSession(options.session) : options.session;
		const user = typeof options.user === "string" ? await this.discordClient.getMember(options.user) : options.user;
		const userId = typeof options.user === "string" ? options.user : options.user.id;
		const kickUser = typeof options.kickUser === "string" ? await this.discordClient.getMember(options.kickUser) : options.kickUser;
		const kickUserId = typeof options.kickUser === "string" ? options.kickUser : options.kickUser.id;
		const softly = options.softly ?? false;

		if (!user) {
			return { success: false, error: "self-not-found" }
		}

		if (!kickUser) {
			return { success: false, error: "user-not-found" }
		}

		if (!session) {
			return { success: false, error: "session-not-found" }
		}

		const isModerator = user.roles.cache.has(this.config.roleIds.mods);
		if (session.hostId !== userId && !isModerator) {
			return { success: false, error: "no-permission" }
		}
		
		if (!session.isUserInSession(kickUserId)) {
			return { success: false, error: "user-not-here" };
		}

		await session.leave(kickUserId, softly ? "soft-kicked" : "kicked");
		if (!softly) {
			await this.discordClient.sendMessage("modLog", {
				content: `${user} just kicked ${kickUser} from their session.`,
			});
		}
		return { success: true }
	}
}