import * as Discord from "discord.js";
import Session from "./session/session";
import constants from "./utils/constants";
import DatabaseClient from "./database-client";
import utils from "./utils/utils";
import TagsHelper from "./shared/tags-helper";
import injectDependency from "./shared/dependency-provider/inject-dependency";

export default class SessionEmbedBuilder {
	private readonly tagsHelper = injectDependency(TagsHelper);
	private readonly databaseClient = injectDependency(DatabaseClient);

	public createPlayerCountField(session: Session): Discord.APIEmbedField {
		const playerNames = session.joinedUserIds.map(id => `<@!${id}>`).join("\n");

		let playersString = `:busts_in_silhouette: ${session.playerCount}/${session.maxPlayers}`;
		if (session.blueprint.preferences.players.min && session.blueprint.preferences.players.min > 1) {
			playersString += ` (Need atleast ${session.blueprint.preferences.players.min} players)`
		}
		playersString += `\n\n${playerNames}`;

		return {name: "Players:", value: playersString};
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
		const tags = this.tagsHelper.getTags(session.blueprint.tags);

		if (tags.length === 0) {
			return undefined;
		}
		return {
			name: "Tags:",
			value: tags.map(tag => {
				return `${tag.icon} ${tag.name}`;
			}).join("\n")
		};
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
			text = `:clock2: ${hoursRoundedToQuarters} hour${hoursRoundedToQuarters === 1 ? "" : "s"}`;
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

	public async createServerOrRealmsField(session: Session): Promise<Discord.APIEmbedField> {
		if (session.blueprint.server.type === "realms") {
			if (session.blueprint.server.owner) {
				return {name: "Realms Host:", value: ":bust_in_silhouette: `" + session.blueprint.server.owner + "`"};
			} else {
				const host = await session.getHost();
				const userData = await (host && this.databaseClient.userRepository.get(host.id));
				const account = session.blueprint.edition === "bedrock" ? userData?.bedrockAccount : (session.blueprint.edition === "java" ? userData?.javaAccount : undefined);
				const displayedUsername = utils.getUsernameString(account) ?? ("`" + ( host?.displayName ?? " ") + "`");
				return {name: "Realms Host:", value: ":bust_in_silhouette: " + displayedUsername};
			}
		} else {
			return {name: "Server Ip:", value: ":mag: `" + session.blueprint.server.ip + "`"};
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

		return {name: "Resource Pack:", value: `:frame_photo: [Link](${rpLink})`};
	}

	public createVersionField(session: Session) {
		if (session.blueprint.edition !== "java" || !session.blueprint.version) {
			return undefined;
		}

		return {name: "Version:", value: ":newspaper: " + session.blueprint.version}
	}

	public createPlayTypeField(session: Session) {
		let text = "";

		switch(session.blueprint.type) {
			case "fun": 
				text = ":tada: Playing for fun";
				break;
			case "record": 
				text = ":camera: Recording for trailer/screenshots";
				break;
			case "stream": 
				text = ":mega: Streaming maptesting/-making";
				break;
			case "test":
				text = ":test_tube: Testing for bugs/feedback";
				break;
		}

		if (!text) {
			return undefined;
		}
		return {name: "Type:", value: text};
	}
}