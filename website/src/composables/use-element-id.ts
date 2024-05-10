import { computed } from "vue"

export default function useElementId(id?: undefined|string|(() => undefined|string)) {
	const givenId = computed(() => {
		if (typeof id === "function") {
			return id();
		}
		return id;
	});

	return computed(() => {
		if (givenId.value) {
			return givenId.value;
		}

		return btoa(Math.random().toString()).replace(/=/g,"");
	});
}