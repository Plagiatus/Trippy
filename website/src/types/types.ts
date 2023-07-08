interface JavaVersion {
	label: string,
	versions: string[]
}

type ApiResponse<TResult> = {
	data: TResult;
	error?: undefined;
	statusError?: undefined;
}|{
	data?: undefined;
	error: unknown;
	statusError?: {status: number, statusText: string};
}

type InputSelectValueType<T> = Readonly<{value: T, name: string}>;
type InputSelectedGroupedValuesType<T> = Readonly<{name: string, values: ReadonlyArray<InputSelectValueType<T>>}>