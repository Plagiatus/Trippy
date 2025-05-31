import injectDependency from "./shared/dependency-provider/inject-dependency";
import TimeHelper from "./time-helper";

export default class CachedFunction<TResult> {
	private readonly timeHelper = injectDependency(TimeHelper);
	private cachedResult: {result: TResult, expireAt: number}|null;
	private cacheTime: number;

	public constructor(private readonly functionToCache: () => TResult, options?: {cacheTime?: number}) {
		this.cachedResult = null;
		this.cacheTime = options?.cacheTime ?? (1000 * 60 * 30/*30 minutes*/);
	}

	getValue() {
		const cache = this.getCache();
		if (cache) {
			return cache.result;
		}

		const newValue = this.functionToCache();
		this.cachedResult = {
			result: newValue,
			expireAt: this.timeHelper.currentDate.getTime() + this.cacheTime,
		};

		if (newValue instanceof Promise) {
			newValue.catch(() => {
				if (this.cachedResult?.result === newValue) {
					this.cachedResult = null;
				}
			});
		}

		return newValue;
	}

	private getCache() {
		if (this.cachedResult?.result) {
			if (this.cachedResult.expireAt < this.timeHelper.currentDate.getTime()) {
				this.cachedResult = null;
			} else {
				return this.cachedResult;
			}
		}

		return null;
	}
}