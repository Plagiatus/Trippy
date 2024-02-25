import Provider from "@/provider/provider";
import Config from "@/config";
import { ApiResponse } from "@/types/types";

export type JwtInformation = {
	jwt: string;
	refreshToken: string;
	expiresIn: number;
}

// Can't extend BaseApiClient because it creates a dependency loop.
export default class AuthenticationApiClient {
	private readonly config: Config;

	public constructor(provider: Provider) {
		this.config = provider.get(Config);
	}

	public async authenticateUsingAuthorizationCode(code: string) {
		return this.post<JwtInformation>(`authentication/code`, { code });
	}

	public async refreshJwt(refreshToken: string) {
		return this.post<JwtInformation>(`authentication/refresh`, { refreshToken });
	}

	public async authenticateUsingLoginToken(token: string) {
		return this.post<JwtInformation>(`authentication/login-token`, { token });
	}

	public async getInformationFromLoginToken(token: string) {
		return this.get<{name: string, avatar: string|null}>(`authentication/login-token`, { token });
	}

	private async get<TResult>(path: string, params?: Record<string,string>) {
		return this.wrapRequest<TResult>(async () => {
			const url = new URL(this.getFullPath(path));
			if (params) {
				for (const [key,value] of Object.entries(params)) {
					url.searchParams.set(key, value);
				}
			}

			return await fetch(url, {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
				}
			});
		});
	}

	private async post<TResult>(path: string, data?: unknown) {
		return this.wrapRequest<TResult>(async () => {
			return await fetch(this.getFullPath(path), {
				method: "POST",
				body: data === undefined ? undefined : JSON.stringify(data),
				headers: {
					"Content-Type": "application/json",
				}
			});
		});
	}

	private async wrapRequest<TResult>(wrapper: () => Promise<Response>): Promise<ApiResponse<TResult>> {
		try {
			const response = await wrapper();
			if (!response.ok) {
				const statusError = { status: response.status, statusText: response.statusText };
				return { error: statusError, statusError: statusError}
			}

			const responseText = await response.text();
			return { data: JSON.parse(responseText) };
		} catch (error) {
			return { error };
		}
	}

	private getFullPath(path: string) {
		if (path.startsWith("/")) {
			return this.config.apiUrl + path;
		}
		return this.config.apiUrl + "/" + path;
	}
}