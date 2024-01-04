import { ButtonBuilder, ButtonStyle } from "discord.js";
import Provider from "../../../provider";
import Config from "../../../config";
import AuthenticationService from "../../../authentication-service";

export default async function createCreateSessionButton(options: {provider: Provider, forUserId: string}) {
	const config = options.provider.get(Config);
	const authenticationService = options.provider.get(AuthenticationService);
	
	const sessionSetupUrl = `${config.frontendUrl}/session/setup`;
	const loginAndSessionSetupUrl = await authenticationService.createLoginLinkWithRedirect(sessionSetupUrl, options.forUserId);

	return new ButtonBuilder()
		.setURL(loginAndSessionSetupUrl)
		.setLabel("Create session")
		.setStyle(ButtonStyle.Link);
}