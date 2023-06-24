export default class Storage {
	public get<TData>(key: string): TData|undefined {
		const data = localStorage.getItem(key);
		if (data === null) {
			return undefined;
		}

		try {
			return JSON.parse(data);
		} catch {
			return undefined;
		}
	}

	public set(key: string, data: unknown) {
		localStorage.setItem(key, JSON.stringify(data))
	}

	public remove(key: string) {
		localStorage.removeItem(key);
	}
}