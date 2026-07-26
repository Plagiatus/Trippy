import { BanData } from "../types/document-types";
import Repository from "./repository";
import * as Mongo from "mongodb";
import SessionsCollection from "../session/sessions-collection";
import DiscordClient from "../bot/discord-client";
import injectDependency from "../shared/dependency-provider/inject-dependency";
import { BanActionResultDto, UnbanActionResultDto } from "../shared/types/dto-types";
import { GuildMember } from "discord.js";

export default class BansRepository extends Repository<BanData, "userId"> {
	private readonly sessionsCollection = injectDependency(SessionsCollection, { reference: true });
	private readonly discordClient = injectDependency(DiscordClient);
	public constructor(collection: Mongo.Collection<BanData>) {
		super(collection, "userId");
	}

	public override async update(document: BanData) {
		return await this.collection.replaceOne(this.getQueryForDocument(document), document, { upsert: true });
	}

	public async isUserBanned(sessionHost: string, userToJoin: string) {
		let host = await super.get(sessionHost);
		if (!host) return false;
		return host.bannedUsers.includes(userToJoin);
	}

	public async makeUserBanUser(options: {user: string | GuildMember, userToBan: string | GuildMember}): Promise<BanActionResultDto> {
		const user = typeof options.user === "string" ? await this.discordClient.getMember(options.user) : options.user;
		const userToBan = typeof options.userToBan === "string" ? await this.discordClient.getMember(options.userToBan) : options.userToBan;

		if (!user) {
			return { success: false, error: "self-not-found" }
		}
		if (!userToBan) {
			return { success: false, error: "user-not-found" }
		}
		if (user.id === userToBan.id) {
			return { success: false, error: "self" };
		}

		if (await this.isUserBanned(user.id, userToBan.id)) {
			return {
				success: false,
				error: "already-banned",
			}
		}

		await this.ban(user.id, userToBan.id);

		await this.discordClient.sendMessage("modLog", {
			content: `${user.toString()} just banned ${userToBan.toString()} from their sessions.`,
		});

		const session = this.sessionsCollection.value.getHostedSession(user);
		if (session && session.isUserInSession(userToBan.id)) {
			await session.leave(userToBan.id, "banned");
		}

		return {
			success: true,
		};
	}

	private async ban(sessionHost: string, userToBan: string) {
		return this.collection.findOneAndUpdate({ userId: sessionHost },
			{
				$addToSet: {
					bannedUsers: userToBan
				}
			}, { upsert: true });
	}

	public async makeUserUnbanUser(options: {user: string | GuildMember, userToUnban: string | GuildMember}): Promise<UnbanActionResultDto> {
		const user = typeof options.user === "string" ? await this.discordClient.getMember(options.user) : options.user;
		const userToUnban = typeof options.userToUnban === "string" ? await this.discordClient.getMember(options.userToUnban) : options.userToUnban;

		if (!user) {
			return { success: false, error: "self-not-found" }
		}
		if (!userToUnban) {
			return { success: false, error: "user-not-found" }
		}
		
		if (!(await this.isUserBanned(user.id, userToUnban.id))) {
			return {
				success: false,
				error: "not-banned",
			}
		}

		await this.unban(user.id, userToUnban.id);

		await this.discordClient.sendMessage("modLog", {
			content: `${user.toString()} just unbanned ${userToUnban.toString()}, they can join their sessions again.`,
		});

		return {
			success: true,
		};
	}

	public async unban(sessionHost: string, userToUnban: string) {
		return this.collection.updateOne({ userId: sessionHost },
			{
				$pull: {
					bannedUsers: {
						$in: [userToUnban]
					}
				}
			});
	}
}