import { Request, Response, NextFunction } from "express";
import Provider from "../../provider";
import AuthenticationService from "../../authentication-service";

export default function isAuthenticatedGuardFactory(provider: Provider) {
	const userAuthenticator = provider.get(AuthenticationService);

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