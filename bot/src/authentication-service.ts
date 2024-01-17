import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v10";
import Provider from "./provider";
import Config from "./config";
import { AccessTokenResponse, UserObject } from "./types/discord-types";
import DatabaseClient from "./database-client";
import DiscordClient from "./bot/discord-client";
import jsonWebToken, { SignOptions } from "jsonwebtoken";
import RecommendationHelper from "./recommendation-helper";

type TokenAndRefreshInformation = {
	jwt: string;
	refreshToken: string;
	expiresIn: number;
}

export default class AuthenticationService {
	private static readonly loginTokenExpireTime = 24 * 60 * 60 * 1000; // 24 hours
	private static readonly jwtExpireTime = 15 * 60 * 1000; // 15 minutes
	private static readonly refreshTokenExpireTime = 7 * 24 * 60 * 60 * 1000; // 7 days

	private readonly config: Config;
	private readonly dbClient: DatabaseClient;
	private readonly discordClient: DiscordClient;
	private readonly recommendationHelper: RecommendationHelper; 

	public constructor(provider: Provider) {
		this.config = provider.get(Config);
		this.dbClient = provider.get(DatabaseClient);
		this.discordClient = provider.get(DiscordClient);
		this.recommendationHelper = provider.get(RecommendationHelper);
	}

	public async authenticateFromAuthorizationCode(code: string): Promise<TokenAndRefreshInformation> {
		const tokenInformation = await this.getDiscordTokenFromCode(code);
		const discordUserData = await this.getUserDataFromDiscordToken(tokenInformation.access_token);

		const jwt = await this.createJwtForUserId(discordUserData.id);
		const refreshToken = this.createDiscordBasedRefreshTokenForUserId(discordUserData.id);
		
		const userData = await this.dbClient.userRepository.get(discordUserData.id);
		userData.discordAuthToken = tokenInformation.access_token;
		await this.dbClient.userRepository.update(userData);

		return {
			jwt,
			refreshToken,
			expiresIn: AuthenticationService.jwtExpireTime,
		}
	}

	public async authenticateFromLoginToken(token: string): Promise<TokenAndRefreshInformation> {
		const userId = await this.getUserIdFromLoginToken(token);

		const userData = await this.dbClient.userRepository.get(userId);
		userData.loginId++;
		await this.dbClient.userRepository.update(userData);

		const jwt = await this.createJwtForUserId(userId);
		const refreshToken = this.createUrlBasedRefreshTokenForUserId(userId, userData.loginId);

		return {
			jwt,
			refreshToken,
			expiresIn: AuthenticationService.jwtExpireTime,
		}
	}

	public async refresh(refreshToken: string): Promise<TokenAndRefreshInformation> {
		const payload = jsonWebToken.verify(refreshToken, this.config.jwtSecret);
		if (typeof payload === "string") {
			throw new Error("Invalid refresh token payload.");
		}

		const type: string = payload["type"];
		if (type === "discord-refresh") {
			const userId: string = payload["userId"];
			return await this.refreshDiscordLoginForUserId(userId);
		} else if (type === "url-refresh") {
			const userId: string = payload["userId"];
			const loginId: number = payload["loginId"];
			return await this.refreshUrlLoginForUserId(userId, loginId);
		}

		throw new Error("Invalid refresh token.");
	}

	public async validateJwt(jwt: string) {
		const payload = jsonWebToken.verify(jwt, this.config.jwtSecret);
		if (typeof payload === "string") {
			throw new Error("Invalid jwt payload.");
		}

		const type: string = payload["type"];
		if (type !== "jwt") {
			throw new Error("Invalid jwt.");
		}

		const userId: string = payload["userId"];

		return {
			userId,
		}
	}

	public async getInformationFromLoginToken(token: string): Promise<{name: string, avatar: string}> {
		const userId = await this.getUserIdFromLoginToken(token);

		const member = await this.discordClient.getMember(userId);
		if (!member) {
			throw new Error(`Member with id ${userId} doesn't exist in the server.`);
		}

		return {
			name: member.displayName,
			avatar: member.displayAvatarURL({size: 256}),
		}
	}

	public async createLoginLinkWithRedirect(redirectTo: string, userId: string) {
		const loginToken = await this.createLoginTokenForUserId(userId);
		const loginUrl = new URL(this.config.frontendUrl);
		loginUrl.pathname = "/login/token";
		loginUrl.searchParams.append("redirect", redirectTo);
		loginUrl.searchParams.append("token", loginToken);

		return loginUrl.toString();
	}

	private async refreshDiscordLoginForUserId(userId: string) {
		const userData = await this.dbClient.userRepository.get(userId);
		if (!userData.discordAuthToken) {
			throw new Error("Not allowed to refresh token.");
		}

		try {
			await this.getUserDataFromDiscordToken(userData.discordAuthToken);
		} catch {
			throw new Error("Not allowed to refresh token.");
		}

		const newJwt = await this.createJwtForUserId(userId);
		const newRefreshToken = this.createDiscordBasedRefreshTokenForUserId(userId);

		return {
			jwt: newJwt,
			refreshToken: newRefreshToken,
			expiresIn: AuthenticationService.jwtExpireTime,
		}
	}

	private async refreshUrlLoginForUserId(userId: string, loginId: number) {
		const userData = await this.dbClient.userRepository.get(userId);
		if (userData.loginId !== loginId) {
			throw new Error("Not allowed to refresh token.");
		}

		const newJwt = await this.createJwtForUserId(userId);
		const newRefreshToken = this.createUrlBasedRefreshTokenForUserId(userId, loginId);

		return {
			jwt: newJwt,
			refreshToken: newRefreshToken,
			expiresIn: AuthenticationService.jwtExpireTime,
		}
	}

	private async getDiscordTokenFromCode(code: string) {
		const params = new URLSearchParams();
		params.append("client_id", this.config.discordAppId);
		params.append("client_secret", this.config.discordOAuthSecret);
		params.append("grant_type", "authorization_code");
		params.append("code", code);
		params.append("redirect_uri", `${this.config.frontendUrl}/login/authenticated`);

		const rest = new REST({ version: "10" }).setToken(this.config.discordApiToken);
		const result = await rest.post(Routes.oauth2TokenExchange(), {
			body: params,
			passThroughBody: true,
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
				"Accept": "application/json",
			}
		});

		return result as AccessTokenResponse;
	}

	private async getUserDataFromDiscordToken(token: string) {
		const rest = new REST({ version: "10", authPrefix: "Bearer" }).setToken(token);
		const result = await rest.get(Routes.user());

		return result as UserObject;
	}

	private async createJwtForUserId(userId: string) {
		const member = await this.discordClient.getMember(userId);
		const userInformation = await this.dbClient.userRepository.get(userId);
		if (!member) {
			throw new Error(`Member with id ${userId} doesn't exist in the server.`);
		}
		
		const payload = {
			type: "jwt",
			userId,
			name: member.user.username,
			avatar: member.displayAvatarURL({size: 256}),
			recommendationScore: this.recommendationHelper.getRecommendationScore(userInformation),
			javaAccount: userInformation.javaAccount,
			bedrockAccount: userInformation.bedrockAccount,
			canUseImages: this.recommendationHelper.canUseImages(userInformation),
		};

		const options: SignOptions = {
			expiresIn: AuthenticationService.jwtExpireTime,
		};

		return jsonWebToken.sign(payload, this.config.jwtSecret, options);
	}

	private createDiscordBasedRefreshTokenForUserId(userId: string) {
		const payload = {
			type: "discord-refresh",
			userId,
		};

		const options: SignOptions = {
			expiresIn: AuthenticationService.refreshTokenExpireTime,
		};

		return jsonWebToken.sign(payload, this.config.jwtSecret, options);
	}

	private createUrlBasedRefreshTokenForUserId(userId: string, loginId: number) {
		const payload = {
			type: "url-refresh",
			userId,
			loginId,
		};

		const options: SignOptions = {
			expiresIn: AuthenticationService.refreshTokenExpireTime,
		};

		return jsonWebToken.sign(payload, this.config.jwtSecret, options);
	}

	private async createLoginTokenForUserId(userId: string) {
		const member = await this.discordClient.getMember(userId);
		if (!member) {
			throw new Error(`Member with id ${userId} doesn't exist in the server.`);
		}

		const userData = await this.dbClient.userRepository.get(userId);
		userData.loginId

		const payload = {
			type: "url-login",
			userId,
			loginId: userData.loginId,
		};

		const options: SignOptions = {
			expiresIn: AuthenticationService.loginTokenExpireTime,
		};

		return jsonWebToken.sign(payload, this.config.jwtSecret, options);
	}

	private async getUserIdFromLoginToken(token: string) {
		const payload = jsonWebToken.verify(token, this.config.jwtSecret);
		if (typeof payload === "string") {
			throw new Error("Invalid login token payload.");
		}

		const type: string = payload["type"];
		if (type !== "url-login") {
			throw new Error("Invalid login token.");
		}

		const userId: string = payload["userId"];
		const loginId: number = payload["loginId"];

		const userData = await this.dbClient.userRepository.get(userId);
		if (userData.loginId !== loginId) {
			throw new Error("Login token is no longer valid.");
		}

		return userId;
	}
}