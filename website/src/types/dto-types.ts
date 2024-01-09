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
		uniqueId: string;
		id: string;
		isHosting: boolean;
		name: string;
		imageId: string|undefined;
	}>
}

export type UserExperiencesListDto = {
	experiences: Array<{
		id: string;
		name: string;
		imageId: string|undefined;
	}>;
}

export type ExperienceInformationDto = {
	experience: {
		id: string,
		defaultBlueprint: SessionBlueprint,
	}
}