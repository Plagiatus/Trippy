import { BanActionResultDto, BanListDto } from "$/types/dto-types";
import BaseApiClient from "./base-api-client";

export default class BanApiClient extends BaseApiClient {
	public async banUser(userId: string) {
		return this.post<BanActionResultDto>(`ban/ban/${encodeURIComponent(userId)}`);
	}

	public async unbanUser(userId: string) {
		return this.post<BanActionResultDto>(`ban/unban/${encodeURIComponent(userId)}`);
	}

	public async getBanList() {
		return this.get<BanListDto>(`ban/list`);
	}
}
