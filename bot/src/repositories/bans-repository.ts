import { BanData } from "../types/document-types";
import Repository from "./repository";
import * as Mongo from "mongodb";
import SessionsCollection from "../session/sessions-collection";
import DiscordClient from "../bot/discord-client";
import injectDependency from "../shared/dependency-provider/inject-dependency";
import { BanActionResultDto, UnbanActionResultDto } from "../shared/types/dto-types";

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

	public async makeUserBanUser(sessionHost: string, userToBan: string): Promise<BanActionResultDto> {
		if (sessionHost === userToBan) {
			return {
				success: false,
				hostUserId: sessionHost,
				targetUserId: userToBan,
				error: "self",
			};
		}
		if (await this.isUserBanned(sessionHost, userToBan)) {
			return {
				success: false,
				hostUserId: sessionHost,
				targetUserId: userToBan,
				error: "already-banned",
			}
		}

		await this.ban(sessionHost, userToBan);

		const hostMember = await this.discordClient.getMember(sessionHost);
		const bannedMember = await this.discordClient.getMember(userToBan);
		if (hostMember && bannedMember) {
			await this.discordClient.sendMessage("modLog", {
				content: `${hostMember.toString()} just banned ${bannedMember.toString()} from their sessions.`,
			});
		}

		const session = this.sessionsCollection.value.getHostedSession(sessionHost);
		if (session && session.hostId === sessionHost && session.isUserInSession(userToBan)) {
			await session.leave(userToBan, "banned");
		}

		return {
			success: true,
			hostUserId: sessionHost,
			targetUserId: userToBan,
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

	public async makeUserUnbanUser(sessionHost: string, userToUnban: string): Promise<UnbanActionResultDto> {
		if (!(await this.isUserBanned(sessionHost, userToUnban))) {
			return {
				success: false,
				hostUserId: sessionHost,
				targetUserId: userToUnban,
				error: "not-banned",
			}
		}

		await this.unban(sessionHost, userToUnban);

		const user = await this.discordClient.getMember(sessionHost);
		const unbannedUser = await this.discordClient.getMember(userToUnban);
		if (user && unbannedUser) {
			await this.discordClient.sendMessage("modLog", {
				content: `${user.toString()} just unbanned ${unbannedUser.toString()}, they can join their sessions again.`,
			});
		}

		return {
			success: true,
			hostUserId: sessionHost,
			targetUserId: userToUnban,
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