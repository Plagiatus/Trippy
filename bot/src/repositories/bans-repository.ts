import { BanData } from "../types/document-types";
import Repository from "./repository";
import Provider from "../shared/provider/provider";
import * as Mongo from "mongodb";

export default class BansRepository extends Repository<BanData, "userId"> {
	public constructor(provider: Provider, collection: Mongo.Collection<BanData>) {
		super(provider, collection, "userId");
	}

	public override async update(document: BanData) {
		return await this.collection.replaceOne(this.getQueryForDocument(document), document, { upsert: true });
	}

	public async isUserBanned(sessionHost: string, userToJoin: string) {
		let host = await super.get(sessionHost);
		if (!host) return false;
		return host.bannedUsers.includes(userToJoin);
	}

	public async ban(sessionHost: string, userToBan: string) {
		return this.collection.findOneAndUpdate({ userId: sessionHost },
			{
				$addToSet: {
					bannedUsers: userToBan
				}
			}, { upsert: true });
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