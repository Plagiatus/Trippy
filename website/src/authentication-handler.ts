import { Ref, shallowRef } from "vue";
import Provider from "./provider/provider";
import RouterWrapper from "./router";
import Storage from "./storage";
import AuthenticationApiClient, { JwtInformation } from "./api-clients/authentication-api-client";
import utils from "./utils/utils";
import { Router } from "vue-router";

type RefreshInformation = {
	jwtExpiresAt: number;
	refreshToken: string;
}

export type OAuthOptions = {
	oAuthUrl: string;
	clientId: string;
	scope: string;
	redirectData?: unknown;
	type?: string;
	redirect?: string;
}

export type UserInformation = Readonly<{
	userId: string;
	avatar: string;
	name: string|null;
	recommendationScore: number;
	javaAccount?: {
		username: string,
		validated: boolean,
	},
	bedrockAccount?: {
		username: string,
		validated: boolean,
	},
	canUseImages: boolean,
}>;

export default class AuthenticationHandler {
	private static readonly stateStorageKey = "oauthState";
	private static readonly refreshInformationStorageKey = "jwtRefreshInformation";
	private static readonly useInformationStorageKey = "userInformation";

	private readonly storage: Storage;
	private readonly authenticationApiClient: AuthenticationApiClient;
	private readonly router: Router;

	private readonly changeableUserInformationRef: Ref<UserInformation|null>;
	private ongoingJwtGetPromise: Promise<string|null>|null;
	private jwt: string|null;

	public constructor(provider: Provider) {
		this.storage = provider.get(Storage);
		this.authenticationApiClient = provider.get(AuthenticationApiClient);
		this.router = provider.get(RouterWrapper).router;

		const userInformation = this.storage.get<UserInformation>(AuthenticationHandler.useInformationStorageKey);
		this.changeableUserInformationRef = shallowRef(userInformation ?? null);
		this.jwt = null;
		this.ongoingJwtGetPromise = null;
	}

	public get userInformation(): UserInformation|null {
		return this.changeableUserInformationRef.value;
	}

	public get refreshRequired() {
		const refreshInformation = this.storage.get<RefreshInformation>(AuthenticationHandler.refreshInformationStorageKey);
		if (!refreshInformation) {
			return false;
		}

		return (Date.now() >= refreshInformation.jwtExpiresAt && this.jwt)
	}

	public isLoggedIn(): this is Omit<AuthenticationHandler,"userInformation">&{userInformation: UserInformation} {
		return !!this.userInformation;
	}

	public redirectToOAuth(options: OAuthOptions) {
		const randomValue = new Uint8Array(16);
		crypto.getRandomValues(randomValue);
		const randomValueAsBase64 = btoa(String.fromCharCode(...randomValue));
		this.storage.set(AuthenticationHandler.stateStorageKey, randomValueAsBase64);

		const url = new URL(options.oAuthUrl);
		url.searchParams.set("response_type", "code");
		url.searchParams.set("scope", options.scope);
		url.searchParams.set("client_id", options.clientId);
		url.searchParams.set("state", JSON.stringify({
			state: randomValueAsBase64,
			data: options.redirectData,
			type: options.type,
		}));
		url.searchParams.set("redirect_uri", this.defaultAuthenticatedRedirectUrl);
		location.href = url.href;
	}

	public getOAuthResult() {
		const url = new URL(location.href);
		const code = url.searchParams.get("code");
		const state = url.searchParams.get("state");

		const expectedState = this.storage.get<string>(AuthenticationHandler.stateStorageKey);
		this.storage.remove(AuthenticationHandler.stateStorageKey);

		if (code === null) {
			throw new Error("No code in the url's parameters.");
		}
		if (state === null) {
			throw new Error("No state in the url's parameters.");
		}

		const parsedState: unknown = JSON.parse(state);
		if (!parsedState || typeof parsedState !== "object") {
			throw new Error("State is invalid.");
		}

		const stateValue = (parsedState as Record<string,unknown>)["state"];
		const redirectData = (parsedState as Record<string,unknown>)["data"];
		const oAuthType = (parsedState as Record<string,unknown>)["type"];

		if (typeof expectedState !== "string" || stateValue !== expectedState || (oAuthType !== undefined && typeof oAuthType !== "string")) {
			throw new Error("State is invalid.");
		}

		return { code, redirectData, oAuthType };
	}

	public async authenticateUsingDiscordCode(code: string): Promise<boolean> {
		const response = await this.authenticationApiClient.authenticateUsingAuthorizationCode(code);
		if (!response.data) {
			return false;
		}

		this.handleJwtInformation(response.data);
		return true;
	}

	public async authenticateUsingLoginToken(token: string) {
		const response = await this.authenticationApiClient.authenticateUsingLoginToken(token);
		if (!response.data) {
			return false;
		}

		this.handleJwtInformation(response.data);
		return true;
	}

	public async getJwt() {
		if (this.ongoingJwtGetPromise) {
			return this.ongoingJwtGetPromise;
		}

		const getFunction = async () => {
			await Promise.resolve(); //Delay to make sure "ongoingJwtGetPromise" is set before beginning.

			const refreshInformation = this.storage.get<RefreshInformation>(AuthenticationHandler.refreshInformationStorageKey);
			if (!refreshInformation) {
				this.setJwt(null);
				return null;
			}
	
			if (Date.now() < refreshInformation.jwtExpiresAt && this.jwt) {
				return this.jwt;
			}

			const refreshResponse = await this.authenticationApiClient.refreshJwt(refreshInformation.refreshToken);
			if (!refreshResponse.data) {
				this.setJwt(null);
				this.router.push({name: "Home"});
				return null;
			}

			const newRefreshInformation: RefreshInformation = {
				jwtExpiresAt: refreshResponse.data.expiresIn + Date.now(),
				refreshToken: refreshResponse.data.refreshToken,
			}
			this.storage.set(AuthenticationHandler.refreshInformationStorageKey, newRefreshInformation);

			this.setJwt(refreshResponse.data.jwt);
			return refreshResponse.data.jwt;
		}

		this.ongoingJwtGetPromise = getFunction();
		try {
			return await this.ongoingJwtGetPromise;
		} finally {
			this.ongoingJwtGetPromise = null;
		}
	}

	public logout() {
		this.setJwt(null);
	}

	protected setJwt(newJwt: string|null) {
		this.jwt = newJwt;
		if (!newJwt) {
			this.storage.remove(AuthenticationHandler.refreshInformationStorageKey);
			this.storage.remove(AuthenticationHandler.useInformationStorageKey);
			this.changeableUserInformationRef.value = null;
			return;
		} else {
			const jwtBody = utils.getJwtBody(newJwt); // jwt is coming from the backend so we trust it's of the correct type.
			if (!jwtBody) {
				this.setJwt(null);
				return;
			}

			this.changeableUserInformationRef.value = {
				avatar: jwtBody.avatar,
				name: jwtBody.name,
				userId: jwtBody.userId,
				bedrockAccount: jwtBody.bedrockAccount,
				javaAccount: jwtBody.javaAccount,
				recommendationScore: jwtBody.recommendationScore,
				canUseImages: jwtBody.canUseImages,
			};
			this.storage.set(AuthenticationHandler.useInformationStorageKey, this.changeableUserInformationRef.value);
		}
	}

	private get defaultAuthenticatedRedirectUrl() {
		const origin = new URL(location.href).origin;
		const authenticatedPath = this.router.resolve({name: "Login.Authenticated"}).fullPath;
		return origin + authenticatedPath;
	}

	private handleJwtInformation(jwtInformation: JwtInformation) {
		const newRefreshInformation: RefreshInformation = {
			jwtExpiresAt: jwtInformation.expiresIn + Date.now(),
			refreshToken: jwtInformation.refreshToken,
		}
		this.storage.set(AuthenticationHandler.refreshInformationStorageKey, newRefreshInformation);

		this.setJwt(jwtInformation.jwt);
	}
}