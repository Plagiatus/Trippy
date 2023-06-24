import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v10";
import Provider from "../provider";
import Config from "../config";
import { AccessTokenResponse, UserObject } from "../types/discord-types";
import DatabaseClient from "../database-client";
import DiscordClient from "../bot/discord-client";
import jsonWebToken, { SignOptions } from "jsonwebtoken";

type TokenAndRefreshInformation = {
	jwt: string;
	refreshToken: string;
	expiresIn: number;
}

export default class UserAuthenticator {
	private static readonly jwtExpireTime = 15 * 60 * 1000; // 15 minutes
	private static readonly refreshTokenExpireTime = 7 * 24 * 60 * 60 * 1000; // 7 days

	private readonly config: Config;
	private readonly dbClient: DatabaseClient;
	private readonly discordClient: DiscordClient;

	public constructor(provider: Provider) {
		this.config = provider.get(Config);
		this.dbClient = provider.get(DatabaseClient);
		this.discordClient = provider.get(DiscordClient);
	}

	public async authenticateFromAuthorizationCode(code: string): Promise<TokenAndRefreshInformation> {
		const tokenInformation = await this.getDiscordTokenFromCode(code);
		const discordUserData = await this.getUserDataFromDiscordToken(tokenInformation.access_token);

		const jwt = await this.createJwtForUserId(discordUserData.id);
		const refreshToken = this.createRefreshTokenForUserId(discordUserData.id);
		
		const userData = await this.dbClient.userRepository.get(discordUserData.id);
		userData.discordAuthToken = tokenInformation.access_token;
		await this.dbClient.userRepository.update(userData, true);

		return {
			jwt,
			refreshToken,
			expiresIn: UserAuthenticator.jwtExpireTime,
		}
	}

	public async refresh(refreshToken: string): Promise<TokenAndRefreshInformation> {
		const payload = jsonWebToken.verify(refreshToken, this.config.jwtSecret);
		if (typeof payload === "string") {
			throw new Error("Invalid refresh token payload.");
		}

		const type: string = payload["type"];
		if (type !== "refresh") {
			throw new Error("Invalid refresh token.");
		}

		const userId: string = payload["userId"];

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
		const newRefreshToken = this.createRefreshTokenForUserId(userId);

		return {
			jwt: newJwt,
			refreshToken: newRefreshToken,
			expiresIn: UserAuthenticator.jwtExpireTime,
		}
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

	private async getDiscordTokenFromCode(code: string) {
		const params = new URLSearchParams();
		params.append("client_id", this.config.discordAppId);
		params.append("client_secret", this.config.discordOAuthSecret);
		params.append("grant_type", "authorization_code");
		params.append("code", code);
		params.append("redirect_uri", `${this.config.frontendUrl}/authenticated`);

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
		if (!member) {
			throw new Error(`Member with id ${userId} doesn't exist in the server.`);
		}
		
		const payload = {
			type: "jwt",
			userId,
			name: member.displayName,
			avatar: member.displayAvatarURL({size: 256}),
		};

		const options: SignOptions = {
			expiresIn: UserAuthenticator.jwtExpireTime,
		};

		return jsonWebToken.sign(payload, this.config.jwtSecret, options);
	}

	private createRefreshTokenForUserId(userId: string) {
		const payload = {
			type: "refresh",
			userId,
		};

		const options: SignOptions = {
			expiresIn: UserAuthenticator.refreshTokenExpireTime,
		};

		return jsonWebToken.sign(payload, this.config.jwtSecret, options);
	}
}