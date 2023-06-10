import { RawSession } from "../types/document-types";
import Repository from "./repository";

export default class SessionRepository extends Repository<RawSession,"id"> {
	public getActiveSessions() {
		return this.collection.find({ state: {$in: ["running","stopping"]} }).toArray();
	}
}