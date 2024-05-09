import { TokenAndRefreshInformationDto } from "$/types/dto-types";
import BaseApiClient from "./base-api-client";

export default class AuthenticationApiClient extends BaseApiClient {
	public async authenticateUsingAuthorizationCode(code: string) {
		return this.post<TokenAndRefreshInformationDto>(`authentication/code`, { code }, {useAuth: false});
	}

	public async refreshJwt(refreshToken: string) {
		return this.post<TokenAndRefreshInformationDto>(`authentication/refresh`, { refreshToken }, {useAuth: false});
	}

	public async authenticateUsingLoginToken(token: string) {
		return this.post<TokenAndRefreshInformationDto>(`authentication/login-token`, { token }, {useAuth: false});
	}

	public async getInformationFromLoginToken(token: string) {
		return this.get<{name: string, avatar: string|null}>(`authentication/login-token`, { token }, {useAuth: false});
	}
}