import { onUnmounted } from "vue";
import useProvidedItem from "./use-provided-item";
import TrippyController, { TextMessageOptions } from "@/trippy-controller";

export default function useTrippyMessage() {
	const trippyController = useProvidedItem(TrippyController);
	let currentMessageCloser: (() => void)|null = null;

	onUnmounted(() => {
		currentMessageCloser?.();
	});

	return {
		displayText(options: TextMessageOptions) {
			currentMessageCloser?.();
			currentMessageCloser = trippyController.displayTextMessage(options);
		},
		closeMessage() {
			currentMessageCloser?.();
		}
	} as const;
}