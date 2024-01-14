import * as Discord from "discord.js";
import Session from "./../session/session";
import constants from "./constants";
import Provider from "../provider";
import DatabaseClient from "../database-client";
import utils from "./utils";

class SessionEmbedUtils {
	public createPlayerCountField(session: Session): Discord.APIEmbedField {
		const playerNames = session.joinedUserIds.map(id => `<@!${id}>`).join("\n");

		return {name: "Players:", value: `${session.playerCount}/${session.maxPlayers}\n\n${playerNames}`};
	}

	public createEditionField(session: Session): Discord.APIEmbedField|undefined {
		let text = "";
		switch(session.blueprint.edition) {
			case "java":
				text = `${constants.javaEditionIcon} Java`;
				break;
			case "bedrock":
				text = `${constants.bedrockEditionIcon} Bedrock`;
				break;
			case "other":
				text = ":question: Other";
				break;
		}

		if (!text) {
			return undefined;
		}
		return {name: "Edition:", value: text};
	}

	public createCategoryField(session: Session): Discord.APIEmbedField|undefined {
		let text = "";
		switch(session.blueprint.category) {
			case "ctm":
				text = ":white_large_square: Complete the Monument";
				break;
			case "hns":
				text = ":mag_right: Hide and Seek";
				break;
			case "multiple":
				text = ":confetti_ball: Multiple";
				break;
			case "other":
				text = ":confetti_ball: Uncategorized";
				break;
			case "parkour":
				text = ":person_running: Parkour";
				break;
			case "puzzle":
				text = ":jigsaw: Puzzle";
				break;
			case "pve":
				text = ":zombie: PVE";
				break;
			case "pvp":
				text = ":crossed_swords: PVP";
				break;
			case "stategy":
				text = ":chess_pawn: Strategy";
				break;
		}

		if (!text) {
			return undefined;
		}
		return {name: "Category:", value: text};
	}

	public createCommuncationField(session: Session): Discord.APIEmbedField|undefined {
		let text = "";

		switch(session.blueprint.preferences.communication) {
			case "vc_encouraged": 
				text = ":sound: Voice chat is encouraged";
				break;
			case "vc_required": 
				text = ":loud_sound: Voice chat is required";
				break;
			case "voice_encouraged": 
				text = ":microphone2: Voice is encouraged";
				break;
			case "voice_required":
				text = ":microphone: Voice is required";
				break;
		}

		if (!text) {
			return undefined;
		}
		return {name: "Communication:", value: text};
	}

	public createExperienceField(session: Session): Discord.APIEmbedField|undefined {
		let text = "";
		
		switch(session.blueprint.preferences.newPlayers) {
			case "new": 
				text = ":baby: New players only";
				break;
			case "exp": 
				text = ":diamond_shape_with_a_dot_inside: Returning players only";
				break;
		}

		if (!text) {
			return undefined;
		}
		return {name: "Experience:", value: text};
	}

	public createEstimateField(session: Session): Discord.APIEmbedField|undefined {
		if (session.blueprint.preferences.timeEstimate === undefined) {
			return undefined;
		}

		let text = "";

		const hours = Math.floor(session.blueprint.preferences.timeEstimate);
		if (hours > 0) {
			const hoursRoundedToQuarters = Math.round(hours * 4) / 4;
			text = `:clock2: ${hoursRoundedToQuarters} hours`;
		} else {
			const minutes = Math.round((session.blueprint.preferences.timeEstimate % 1) * 60);
			let minutesRoundedToNearestFive = Math.round(minutes / 5) * 5;
			if (minutesRoundedToNearestFive === 0) {
				minutesRoundedToNearestFive = 5;
			}
	
			text = `:clock2: ${minutesRoundedToNearestFive} minutes`;
		}

		return {name: "Time Estimate", value: text};
	}

	public async createServerOrRealmsField(provider: Provider, session: Session): Promise<Discord.APIEmbedField> {
		if (session.blueprint.server.type === "realms") {
			if (session.blueprint.server.owner) {
				return {name: "Realms Host:", value: "`" + session.blueprint.server.owner + "`"};
			} else {
				const host = await session.getHost();
				const userData = await (host && provider.get(DatabaseClient).userRepository.get(host.id));
				const account = session.blueprint.edition === "bedrock" ? userData?.bedrockAccount : (session.blueprint.edition === "java" ? userData?.javaAccount : undefined);
				const displayedUsername = utils.getUsernameString(account) ?? ("`" + ( host?.displayName ?? " ") + "`");
				return {name: "Realms Host:", value: displayedUsername};
			}
		} else {
			return {name: "Server Ip:", value: "`" + session.blueprint.server.ip + "`"};
		}
	}

	public createResourcepackField(session: Session): Discord.APIEmbedField|undefined {
		if (!session.blueprint.rpLink) {
			return undefined;
		}

		let rpLink = session.blueprint.rpLink;
		if (!rpLink.startsWith("https://") && !rpLink.startsWith("http://")) {
			rpLink = "https://" + session.blueprint.rpLink;
		}

		return {name: "Resource Pack:", value: `[Link](${rpLink})`};
	}
}

export default new SessionEmbedUtils();