class Utils {
	getJwtBody(jwt: string): unknown {
		try {
			const jwtParts = jwt.split(".");
			if (jwtParts.length !== 3) {
				return {};
			}

			const jwtBody = jwtParts[1];
			const jwtBodyJson = atob(jwtBody);
			const parsedJwtBody = JSON.parse(jwtBodyJson);
			return parsedJwtBody;
		} catch {
			return {};
		}
	}
}

export default new Utils();