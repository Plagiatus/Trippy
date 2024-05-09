import { ButtonBuilder, ButtonStyle } from "discord.js";
import DependencyProvider from "../../../shared/dependency-provider/dependency-provider";
import Config from "../../../config";
import AuthenticationService from "../../../authentication-service";

export default async function createEditSessionButton(options: {provider: DependencyProvider, forUserId: string, sessionId: string, disabled?: boolean}) {
	const config = options.provider.get(Config);
	const authenticationService = options.provider.get(AuthenticationService);

	const sessionOverviewUrl = `${config.frontendUrl}/session/${options.sessionId}`;
	const loginAndSessionOverviewUrl = await authenticationService.createLoginLinkWithRedirect(sessionOverviewUrl, options.forUserId);

	return new ButtonBuilder()
		.setURL(loginAndSessionOverviewUrl)
		.setLabel("Edit session")
		.setDisabled(options.disabled ?? false)
		.setStyle(ButtonStyle.Link);
}