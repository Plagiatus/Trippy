export default class TimeHelper {
	public readonly millisecondsInSecond = 1000;
	public readonly millisecondsInMinute = this.millisecondsInSecond * 60;
	public readonly millisecondsInHour = this.millisecondsInMinute * 60;
	public readonly millisecondsInDay = this.millisecondsInHour * 24;

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

	public getMillisecondsInType(type: "day"|"week"|"month"|"year") {
		switch(type) {
			case "day":
				return this.millisecondsInDay;
			case "week":
				return this.millisecondsInDay * 7;
			case "month":
				return this.millisecondsInDay * 31;
			case "year":
				return this.millisecondsInDay * 366;
		}
	}
}