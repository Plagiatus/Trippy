import { shallowRef, useSlots, watchEffect } from "vue";

export default function useIsSlotEmpty(slot: string = "default") {
	const isRenderingComponent = shallowRef(false);

	const slots = useSlots();

	watchEffect(() => {
		const childrenRender = slots[slot];
		if (!childrenRender) {
			isRenderingComponent.value = false;
			return;
		}

		const children = childrenRender();
		if (children.length === 0) {
			isRenderingComponent.value = false;
			return;
		}

		isRenderingComponent.value = children.some(child => typeof child.type === "string" || typeof child.type === "object" || typeof child.type === "symbol" && child.type.description === "Text")
	})

	return isRenderingComponent;
}