/**
 * https://discord.com/developers/docs/topics/oauth2#authorization-code-grant-access-token-response
 */
export type AccessTokenResponse = {
	"access_token": string;
	"token_type": "Bearer";
	"expires_in": number;
	"refresh_token": string;
	"scope": string;
}

/**
 * https://discord.com/developers/docs/resources/user#user-object
 */
export type UserObject = {
	id: string;
}