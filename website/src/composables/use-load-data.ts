import { computed, onUnmounted, shallowReactive, watchEffect } from "vue";

export default function useLoadData<T>(getter: () => Promise<ApiResponse<T>>, shouldRunGetter?: () => boolean) {
	const values = shallowReactive({
		isLoading: true,
		failedToLoad: false,
		data: undefined as undefined|T,
	});

	const responsePromise = computed(getter);
	const shouldRun = computed(shouldRunGetter ?? (() => true));

	watchEffect(async (cleanup) => {
		if (!shouldRun.value) {
			return;
		}

		let useResponse = true;
		cleanup(() => useResponse = false);
		
		values.isLoading = false;
		values.failedToLoad = false;
		values.data = undefined;

		const response = await responsePromise.value;
		if (!useResponse) {
			return;
		}

		values.data = response.data;
		values.isLoading = false;
		values.failedToLoad = !!response.error || !!response.statusError;
	});

	return values;
}