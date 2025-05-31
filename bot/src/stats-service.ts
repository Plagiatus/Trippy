import CachedFunction from "./cached-function";
import DatabaseClient from "./database-client";
import injectDependency from "./shared/dependency-provider/inject-dependency";
import { CountAtTimeIntervalDto, PeriodSessionStatsDto, PeriodSessionStatsTypeDto } from "./shared/types/dto-types";
import TimeHelper from "./time-helper";

export default class StatsService {
	private readonly timeHelper = injectDependency(TimeHelper);
	private readonly databaseClient = injectDependency(DatabaseClient);

	private readonly dailyStatsGetter: CachedFunction<Promise<PeriodSessionStatsDto>>;
	private readonly weeklyStatsGetter: CachedFunction<Promise<PeriodSessionStatsDto>>;
	private readonly monthlyStatsGetter: CachedFunction<Promise<PeriodSessionStatsDto>>;
	private readonly yearlyStatsGetter: CachedFunction<Promise<PeriodSessionStatsDto>>;
	private readonly allTimeStatsGetter: CachedFunction<Promise<PeriodSessionStatsDto>>;

	public constructor() {
		const cacheTime = this.timeHelper.millisecondsInMinute * 30

		this.dailyStatsGetter = new CachedFunction(async () => {
			const endOfPeriod = this.timeHelper.currentDate;
			const startOfPeriod = new Date(endOfPeriod);
			startOfPeriod.setUTCDate(startOfPeriod.getUTCDate() - 1);

			return await this.getSessionStatsForPeriode({
				from: startOfPeriod,
				to: endOfPeriod,
				millisecondIntervals: this.timeHelper.millisecondsInMinute * 20,
				aggregate: "day",
			});
		}, {cacheTime});

		this.weeklyStatsGetter = new CachedFunction(async () => {
			const endOfPeriod = this.timeHelper.currentDate;
			const startOfPeriod = new Date(endOfPeriod);
			startOfPeriod.setUTCDate(startOfPeriod.getUTCDate() - 7);

			return await this.getSessionStatsForPeriode({
				from: startOfPeriod,
				to: endOfPeriod,
				millisecondIntervals: this.timeHelper.millisecondsInHour * 4,
				aggregate: "week",
			});
		}, {cacheTime});

		this.monthlyStatsGetter = new CachedFunction(async () => {
			const endOfPeriod = this.timeHelper.currentDate;
			const startOfPeriod = new Date(endOfPeriod);
			startOfPeriod.setUTCMonth(startOfPeriod.getUTCMonth() - 1);

			return await this.getSessionStatsForPeriode({
				from: startOfPeriod,
				to: endOfPeriod,
				millisecondIntervals: this.timeHelper.millisecondsInDay,
				aggregate: "month",
			});
		}, {cacheTime});

		this.yearlyStatsGetter = new CachedFunction(async () => {
			const endOfPeriod = this.timeHelper.currentDate;
			const startOfPeriod = new Date(endOfPeriod);
			startOfPeriod.setUTCFullYear(startOfPeriod.getUTCFullYear() - 1);

			return await this.getSessionStatsForPeriode({
				from: startOfPeriod,
				to: endOfPeriod,
				millisecondIntervals: this.timeHelper.millisecondsInDay * 5,
				aggregate: "year",
			});
		}, {cacheTime});

		this.allTimeStatsGetter = new CachedFunction(async () => {
			const firstSessionStart = await this.databaseClient.sessionRepository.getFirstSessionStartTime();

			const endOfPeriod = this.timeHelper.currentDate;
			const startOfPeriod = firstSessionStart ? new Date(firstSessionStart) : endOfPeriod;
			const intervals = Math.floor((endOfPeriod.getTime() - startOfPeriod.getTime()) / 70);
			const intervalsRoundedToDays = Math.round(intervals / this.timeHelper.millisecondsInDay) * this.timeHelper.millisecondsInDay;

			return await this.getSessionStatsForPeriode({
				from: startOfPeriod,
				to: endOfPeriod,
				millisecondIntervals: intervalsRoundedToDays,
			});
		}, {cacheTime});
	}

	public async getSessionStatsForPeriode(options: {from: Date, to: Date, aggregate?: "day"|"week"|"month"|"year", millisecondIntervals: number}): Promise<PeriodSessionStatsDto> {
		const minimumRunTimeAndPlayTimeRequiredToBeCounted = this.timeHelper.millisecondsInMinute * 10;
		const from = new Date(Math.floor(options.from.getTime() / options.millisecondIntervals) * options.millisecondIntervals);
		const to = new Date(Math.ceil(options.to.getTime() / options.millisecondIntervals) * options.millisecondIntervals);
		const aggregatedStartTime = new Date(0);
		const aggregatedEndTime = options.aggregate ? new Date(this.timeHelper.getMillisecondsInType(options.aggregate) - 1) : new Date(0);
		
		const playersInPeriode = this.addMissingIntervals(await this.databaseClient.sessionRepository.getAmountOfPlayersInSessionsStats({
			from: from,
			to: to,
			millisecondIntervals: options.millisecondIntervals,
			minimumPlayTimeRequired: minimumRunTimeAndPlayTimeRequiredToBeCounted,
		}), options.millisecondIntervals, from, to);

		let aggregatedPlayersInPeriode: CountAtTimeIntervalDto[] | undefined = undefined;
		if (options.aggregate !== undefined) {
			aggregatedPlayersInPeriode = this.addMissingIntervals(await this.databaseClient.sessionRepository.getAmountOfPlayersInSessionsStats({
				millisecondIntervals: options.millisecondIntervals,
				aggregate: options.aggregate,
				minimumPlayTimeRequired: minimumRunTimeAndPlayTimeRequiredToBeCounted,
			}), options.millisecondIntervals, aggregatedStartTime, aggregatedEndTime);
		}

		const sessionsInPeriode = this.addMissingIntervals(await this.databaseClient.sessionRepository.getAmountOfSessionsStats({
			from: from,
			to: to,
			millisecondIntervals: options.millisecondIntervals,
			minimumRunTimeRequired: minimumRunTimeAndPlayTimeRequiredToBeCounted,
		}), options.millisecondIntervals, from, to);

		let aggregatedSessionsInPeriode: CountAtTimeIntervalDto[] | undefined = undefined;
		if (options.aggregate !== undefined) {
			aggregatedSessionsInPeriode = this.addMissingIntervals(await this.databaseClient.sessionRepository.getAmountOfSessionsStats({
				millisecondIntervals: options.millisecondIntervals,
				aggregate: options.aggregate,
				minimumRunTimeRequired: minimumRunTimeAndPlayTimeRequiredToBeCounted,
			}), options.millisecondIntervals, aggregatedStartTime, aggregatedEndTime);
		}

		const totalPlayers = await this.databaseClient.sessionRepository.getTotalPlayersInPeriod({
			from: from,
			to: to,
			minimumPlayTimeRequired: minimumRunTimeAndPlayTimeRequiredToBeCounted,
		});

		const totalUniquePlayers = await this.databaseClient.sessionRepository.getTotalPlayersInPeriod({
			from: from,
			to: to,
			unique: true,
			minimumPlayTimeRequired: minimumRunTimeAndPlayTimeRequiredToBeCounted,
		});

		const totalSessions = await this.databaseClient.sessionRepository.getTotalHostsInPeriod({
			from: from,
			to: to,
			minimumRunTimeRequired: minimumRunTimeAndPlayTimeRequiredToBeCounted,
		});

		const totalUniqueHosts = await this.databaseClient.sessionRepository.getTotalHostsInPeriod({
			from: from,
			to: to,
			unique: true,
			minimumRunTimeRequired: minimumRunTimeAndPlayTimeRequiredToBeCounted,
		});

		const totalUniqueExperiences = await this.databaseClient.sessionRepository.getTotalUniqueExperiencesInPeriod({
			from: from,
			to: to,
			minimumRunTimeRequired: minimumRunTimeAndPlayTimeRequiredToBeCounted,
		});

		return {
			players: playersInPeriode,
			sessions: sessionsInPeriode,
			aggregatedPlayers: aggregatedPlayersInPeriode,
			aggregatedSessions: aggregatedSessionsInPeriode,
			totalJoins: totalPlayers,
			totalUniqueJoins: totalUniquePlayers,
			totalSessions: totalSessions,
			totalUniqueHosts: totalUniqueHosts,
			totalUniqueExperiences: totalUniqueExperiences,
			start: from.getTime(),
			end: to.getTime(),
			aggreatedStart: aggregatedStartTime.getTime(),
			aggregatedEnd: aggregatedEndTime.getTime(),
			intervals: options.millisecondIntervals,
		}
	}

	private addMissingIntervals(data: ReadonlyArray<CountAtTimeIntervalDto>, intervals: number, from: Date, to: Date) {
		const filledData: CountAtTimeIntervalDto[] = [];
		let atTime = Math.floor(from.getTime() / intervals) * intervals;
		let atIndex = 0;
		while (atTime <= to.getTime()) {
			if (atIndex < data.length && data[atIndex].dateTime === atTime) {
				filledData.push(data[atIndex]);
				atIndex++;
			} else {
				filledData.push({
					count: 0,
					dateTime: atTime,
				});
			}

			atTime += intervals;
		}

		return filledData;
	}

	public async getCachedSessionStats(type: PeriodSessionStatsTypeDto) {
		switch(type) {
			case "day":
				return this.dailyStatsGetter.getValue();
			case "week":
				return this.weeklyStatsGetter.getValue();
			case "month":
				return this.monthlyStatsGetter.getValue();
			case "year":
				return this.yearlyStatsGetter.getValue();
			case "all":
				return this.allTimeStatsGetter.getValue();
		}
	}
}