import { RefOrValue } from "@/types/types";
import { computed, isRef } from "vue";

export default function useRefOrValue<T>(refOrValue: RefOrValue<T>) {
	return computed(() => {
		if (isRef(refOrValue)) {
			return refOrValue.value
		} else if (typeof refOrValue === "function") {
			return (refOrValue as () => T)();
		} else {
			return refOrValue;
		}
	});
}