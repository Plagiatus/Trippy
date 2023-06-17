export default class Impersonation {
	private readonly impersonations: Map<string,string>;

	public constructor() {
		this.impersonations = new Map();
	}

	public addImpersonation(impersonatorId: string, impersonateAsId: string) {
		if (impersonatorId === impersonateAsId) {
			this.clearImpersonation(impersonatorId);
		} else {
			this.impersonations.set(impersonatorId, impersonateAsId);
		}
	}

	public clearImpersonation(impersonatorId: string) {
		this.impersonations.delete(impersonatorId);
	}

	public getId(id: string) {
		return this.impersonations.get(id) ?? id;
	}
}