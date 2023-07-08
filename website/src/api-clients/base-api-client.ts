import AuthenticationHandler from "@/authentication-handler";
import Config from "@/config";
import Provider from "@/provider/provider";

export default abstract class BaseApiClient {
	protected readonly config: Config;
	private readonly authenticationHandler: AuthenticationHandler;

	public constructor(provider: Provider) {
		this.config = provider.get(Config);
		this.authenticationHandler = provider.get(AuthenticationHandler);
	}

	protected async get<TResult>(path: string, params?: Record<string,string>, options?: {useAuth?: boolean}) {
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
					...await this.getAuthHeader(options?.useAuth),
				}
			});
		});
	}

	protected async post<TResult>(path: string, data?: unknown, options?: {useAuth?: boolean}) {
		return this.wrapRequest<TResult>(async () => {
			return await fetch(this.getFullPath(path), {
				method: "POST",
				body: data === undefined ? undefined : JSON.stringify(data),
				headers: {
					"Content-Type": "application/json",
					...await this.getAuthHeader(options?.useAuth),
				}
			});
		});
	}

	private async getAuthHeader(useAuth: boolean|undefined): Promise<{}|{"authorization": string}> {
		if (!(useAuth ?? true)) {
			return {};
		}

		const jwt = await this.authenticationHandler.getJwt();
		if (!jwt) {
			return {};
		}

		return {
			"authorization": `bearer ${jwt}`
		};
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