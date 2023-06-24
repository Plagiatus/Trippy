import Provider from "@/provider/provider";
import BaseApiClient from "./base-api-client";

export type JwtInformation = {
	jwt: string;
	refreshToken: string;
	expiresIn: number;
}

export default class AuthenticationApiClient extends BaseApiClient {
	public constructor(provider: Provider) {
		super(provider);
	}

	public async authenticateUsingAuthorizationCode(code: string) {
		return this.post<JwtInformation>(`authentication/code`, { code }, {useAuth: false});
	}

	public async refreshJwt(refreshToken: string) {
		return this.post<JwtInformation>(`authentication/refresh`, { refreshToken }, {useAuth: false});
	}
}