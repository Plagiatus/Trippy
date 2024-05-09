import { Request, Response, NextFunction, RequestHandler } from "express";
import AuthenticationService from "../../authentication-service";
import injectDependency from "../../shared/dependency-provider/inject-dependency";
import createInjectionKeyAndGetter from "../../shared/dependency-provider/create-injection-key-and-getter";

export const {key: isAuthenticatedGuardKey, getter: getIsAuthenticatedGuard} = createInjectionKeyAndGetter<RequestHandler>();

export function isAuthenticatedGuardFactory() {
	const userAuthenticator = injectDependency(AuthenticationService);

	return async (req: Request, res: Response, next: NextFunction) => {
		const authorizationHeader = req.headers["authorization"];
		if (typeof authorizationHeader !== "string") {
			return res.sendStatus(401);
		}

		const headerParts = authorizationHeader.split(" ");
		if (headerParts.length !== 2) {
			return res.sendStatus(401);
		}

		if (headerParts[0] !== "bearer") {
			return res.sendStatus(401);
		}

		const token = headerParts[1];
		try {
			const result = await userAuthenticator.validateJwt(token);
			req.userId = result.userId;
			next();
		} catch {
			return res.sendStatus(401);
		}
	}
}