import { Ref } from "vue";

export interface JavaVersion {
	label: string,
	versions: string[]
}

export type ApiResponse<TResult> = {
	data: TResult;
	error?: undefined;
	statusError?: undefined;
}|{
	data?: undefined;
	error: unknown;
	statusError?: {status: number, statusText: string};
}

export type InputSelectValueType<T> = Readonly<{value: T, name: string}>;
export type InputSelectedGroupedValuesType<T> = Readonly<{name: string, values: ReadonlyArray<InputSelectValueType<T>>}>;
export type RefOrValue<T> = Ref<T>|T|(() => T);