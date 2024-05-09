import AuthenticationService from "../../authentication-service";
import injectDependency from "../../shared/dependency-provider/inject-dependency";
import RouteMaker from "../route";

export default (({server, responses}) => { 
	const userAuthenticator = injectDependency(AuthenticationService);

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
            } catch {
                responses.sendCustomError("Unable to authenticate using the given code.", res);
            }
        })
        .all(responses.wrongMethod);

    server.route("/authentication/login-token")
        .get(async (req, res) => {
            const token = req.query.token;
            if (typeof token !== "string") {
                responses.sendCustomError("No token was given.", res);
                return;
            }

            try {
			    const userInformation = await userAuthenticator.getInformationFromLoginToken(token);
			    res.send(userInformation);
            } catch {
                responses.sendCustomError("Unable to get user information from token.", res);
            }
        })
        .post(async (req, res) => {
            const token = req.body.token;
            if (typeof token !== "string") {
                responses.sendCustomError("No token was given.", res);
                return;
            }

            try {
			    const tokenData = await userAuthenticator.authenticateFromLoginToken(token);
			    res.send(tokenData);
            } catch {
                responses.sendCustomError("Unable to authenticate using the given token.", res);
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