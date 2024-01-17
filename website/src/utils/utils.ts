class Utils {
	getJwtBody(jwt: string): null|Record<string,any> {
		try {
			const jwtParts = jwt.split(".");
			if (jwtParts.length !== 3) {
				return null;
			}

			const jwtBody = jwtParts[1];
			const jwtBodyJson = atob(jwtBody);
			const parsedJwtBody = JSON.parse(jwtBodyJson);
			return parsedJwtBody;
		} catch {
			return null;
		}
	}
}

export default new Utils();