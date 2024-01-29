export default class TimeHelper {
	public get currentDate() {
		return new Date();
	}

	public formatCountdown(millisecondsLeft: number) {
		const countdownEndingDate = new Date(this.currentDate.getTime() + millisecondsLeft);
		return this.discordFormatRelativeTime(countdownEndingDate);
	}

	public discordFormatRelativeTime(date: Date) {
		return `<t:${this.getUnixTimestamp(date)}:R>`;
	}

	private getUnixTimestamp(date: Date) {
		return Math.round(date.getTime() / 1000);
	}
}