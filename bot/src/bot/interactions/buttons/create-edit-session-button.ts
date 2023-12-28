import { ButtonBuilder, ButtonStyle } from "discord.js";
import Provider from "../../../provider";
import Config from "../../../config";
import AuthenticationService from "../../../authentication-service";

export default async function createEditSessionButton(options: {provider: Provider, forUserId: string, sessionId: string, disabled?: false}) {
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