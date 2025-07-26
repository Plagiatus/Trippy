import { onUnmounted } from "vue";
import useDependency from "./use-dependency";
import TrippyController, { ComponentMessageOptions, TextMessageOptions } from "@/trippy-controller";

export default function useTrippyMessage() {
	const trippyController = useDependency(TrippyController);
	let currentMessageCloser: (() => void)|null = null;

	onUnmounted(() => {
		currentMessageCloser?.();
	});

	return {
		displayText(options: TextMessageOptions) {
			currentMessageCloser?.();
			currentMessageCloser = trippyController.displayTextMessage(options);
		},
		displayComponent(options: ComponentMessageOptions) {
			currentMessageCloser?.();
			currentMessageCloser = trippyController.displayComponentMessage(options);
		},
		closeMessage() {
			currentMessageCloser?.();
		}
	} as const;
}