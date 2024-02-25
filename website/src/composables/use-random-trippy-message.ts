import type TrippyController from "@/trippy-controller";
import { TextMessageOptions } from "@/trippy-controller";
import { onMounted, onUnmounted } from "vue";
import useTrippyMessage from "./use-trippy-message";

type messageOptionWithWeight = TextMessageOptions&{weight?: number};
export default function useRandomTrippyMessage(possibleMessagesGetter: (add: (message: messageOptionWithWeight) => void) => Array<messageOptionWithWeight>|void, options?: {minimumSecondsDelay?: number, maximumSecondsDelay?: number, keepOnSendingMessages?: boolean, autoCloseInSeconds?: number}) {
	const message = useTrippyMessage();
	let messageTimeout: number|undefined = undefined;
	
	onMounted(startSendingNewMessage);
	function startSendingNewMessage() {
		const baseDelay = (options?.minimumSecondsDelay ?? 10) * 1000;
		const extraDelay = (options?.maximumSecondsDelay ?? 40) * 1000 - baseDelay;

		const delay = Math.random() * extraDelay + baseDelay;

		clearTimeout(messageTimeout);
		messageTimeout = setTimeout(sendMessage, delay);
	}

	function sendMessage() {
		const possibleMessages: messageOptionWithWeight[] = [];
		possibleMessages.push(...possibleMessagesGetter((message) => {
			possibleMessages.push(message);
		}) ?? []);

		const totalWeight = possibleMessages.reduce((sum, message) => sum + (message.weight ?? 1), 0);
		const randomValue = Math.random() * totalWeight;

		let messageToDisplay: TextMessageOptions|null = null;
		let atWeight = 0;
		for (const message of possibleMessages) {
			atWeight += message.weight ?? 1;
			if (randomValue < atWeight) {
				messageToDisplay = message;
				break;
			}
		}

		if (!messageToDisplay) {
			handleMessageClosed();
			return;
		}

		message.displayText({
			...messageToDisplay,
			autoCloseInSeconds: messageToDisplay.autoCloseInSeconds ?? options?.autoCloseInSeconds,
			onClose() {
				handleMessageClosed();
				messageToDisplay?.onClose?.();
			}
		});
	}

	function handleMessageClosed() {
		if (options?.keepOnSendingMessages) {
			startSendingNewMessage();
		}
	}

	onUnmounted(() => {
		clearTimeout(messageTimeout);
	})
}