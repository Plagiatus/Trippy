export default class TimeHelper {
	public readonly millisecondsInSecond = 1000;
	public readonly millisecondsInMinute = this.millisecondsInSecond * 60;
	public readonly millisecondsInHour = this.millisecondsInMinute * 60;
	public readonly millisecondsInDay = this.millisecondsInHour * 24;

	public get currentDate() {
		return new Date();
	}

	public formatDateTime(date: Date, options?: { time?: boolean, date?: boolean }) {
		return date.toLocaleString(undefined, {
			dateStyle: (options?.date ?? true) ? "medium" : undefined,
			timeStyle: (options?.time ?? true) ? "medium" : undefined,
		});
	}

	public formatTime(milliseconds: number) {
		const seconds = Math.ceil(milliseconds / this.millisecondsInSecond) % 60;
		const minutes = Math.floor(milliseconds / this.millisecondsInMinute) % 60;
		const hours = Math.floor(milliseconds / this.millisecondsInHour) % 60;

		return [
			hours > 0 ? `${hours}h` : undefined,
			(minutes > 0 || hours > 0) ? `${minutes}m` : undefined,
			`${seconds}s`,
		].filter(part => part !== undefined).join(" ");
	}
}