import { Session } from "../types/document-types";
import Repository from "./repository";

export default class SessionRepository extends Repository<Session,"id"> {
	public getActiveSessions() {
		return this.collection.find({ endTime: -1 }).toArray();
	}
}