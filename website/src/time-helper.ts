export default class TimeHelper {
	public get currentDate() {
		return new Date();
	}

	public formatDateTime(date: Date) {
		return date.toLocaleString(undefined, {
			dateStyle: "medium",
			timeStyle: "medium",
		});
	}
}