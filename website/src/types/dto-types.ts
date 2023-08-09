import { SessionBlueprint } from "./session-blueprint-types"

export type SessionInformationDto = {
	blueprint: SessionBlueprint;
	id: string;
	users: Array<{
		id: string;
		name: string;
		avatar: string|null;
	}>;
}

export type UserSessionsListDto = {
	sessions: Array<{
		isHosting: boolean;
		name: string;
		id: string;
	}>
}