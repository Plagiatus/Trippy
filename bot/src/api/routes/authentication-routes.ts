import UserAuthenticator from "../user-authenticator";
import RouteMaker from "../route";

export default (({server, responses, provider}) => { 
	const userAuthenticator = provider.get(UserAuthenticator);

    server.route("/authentication/code")
        .post(async (req, res) => {
            const code = req.body.code;
            if (typeof code !== "string") {
                responses.sendCustomError("No code was given.", res);
                return;
            }

            try {
			    const tokenData = await userAuthenticator.authenticateFromAuthorizationCode(code);
			    res.send(tokenData);
            } catch(error) {
                console.log(error);
                responses.sendCustomError("Unable to authenticate using the given code.", res);
            }
        })
        .all(responses.wrongMethod);

    server.route("/authentication/refresh")
        .post(async (req, res) => {
            const refreshToken = req.body.refreshToken;
            if (typeof refreshToken !== "string") {
                responses.sendCustomError("No refresh token was given.", res);
                return;
            }

            try {
			    const tokenData = await userAuthenticator.refresh(refreshToken);
			    res.send(tokenData);
            } catch {
                responses.sendCustomError("Failed to refresh.", res);
            }
        })
        .all(responses.wrongMethod);
}) satisfies RouteMaker