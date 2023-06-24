interface JavaVersion {
	label: string,
	versions: string[]
}

type ApiResponse<TResult> = {
	data: TResult;
	error?: undefined;
}|{
	data?: undefined;
	error: unknown;
}