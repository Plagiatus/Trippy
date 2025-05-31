export default class TimeHelper {
	public readonly millisecondsInSecond = 1000;
	public readonly millisecondsInMinute = this.millisecondsInSecond * 60;
	public readonly millisecondsInHour = this.millisecondsInMinute * 60;
	public readonly millisecondsInDay = this.millisecondsInHour * 24;

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