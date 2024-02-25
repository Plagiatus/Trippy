import { watchEffect } from "vue";
import useTrippyMessage from "./use-trippy-message";
import { RefOrValue } from "@/types/types";
import useRefOrValue from "./use-ref-or-value";
import { TrippyMood } from "@/trippy-controller";

export default function useTrippyInformationMessage(text: RefOrValue<string>, options?: {mood?: RefOrValue<TrippyMood>}) {
	const message = useTrippyMessage();
	const textRef = useRefOrValue(text);
	const moodRef = useRefOrValue(options?.mood);
	let messageHasBeenClosed = false;

	watchEffect(() => {
		if (messageHasBeenClosed) {
			return;
		}

		message.displayText({
			message: textRef.value,
			mood: moodRef.value,
			onClose: () => {
				messageHasBeenClosed = true;
			}
		})
	});
}