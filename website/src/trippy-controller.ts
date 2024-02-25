import { Ref, shallowRef } from "vue";

export default class TrippyController {
	private readonly messages: MessageInformation[];
	private readonly _currentMessage: Ref<MessageInformation|null>;
	private currentMessageCloseTimeout: number|undefined;

	public constructor() {
		this.messages = [];
		this._currentMessage = shallowRef(null);
	}

	public get currentMessage() {
		return this._currentMessage.value;
	}

	public get totalMessages() {
		return this.messages.length;
	}

	public displayTextMessage(options: TextMessageOptions) {
		const message: TextMessageInformation = {
			message: options.message,
			mood: options.mood ?? "normal",
			relevance: options.relevance ?? 0,
			type: "text",
			autoCloseInSeconds: options.autoCloseInSeconds,
			autoCloseEvenIfHidden: options.autoCloseEvenIfHidden ?? false,
			onClose: options.onClose,
		}
		this.messages.push(message);

		if (message.autoCloseEvenIfHidden && message.autoCloseInSeconds !== undefined) {
			setTimeout(() => {
				this.closeMessage(message);
			}, message.autoCloseInSeconds * 1000);
		}

		this.updateMessageToDisplay();

		return () => {
			this.closeMessage(message);
		}
	}

	public closeMessage(message: MessageInformation) {
		const messageIndex = this.messages.findIndex(checkMessage => checkMessage === message);
		if (messageIndex < 0) {
			return;
		}

		this.messages.splice(messageIndex, 1);
		message.onClose?.(message);
		this.updateMessageToDisplay();
	} 

	public closeCurrentMessage() {
		if (this.currentMessage) {
			this.closeMessage(this.currentMessage);
		}
	}

	private updateMessageToDisplay() {
		let messageWithHighestRelevance: MessageInformation|null = null;

		for (const message of this.messages) {
			if ((messageWithHighestRelevance?.relevance ?? Number.NEGATIVE_INFINITY) < message.relevance) {
				messageWithHighestRelevance = message;
			}
		}

		if (this._currentMessage.value === messageWithHighestRelevance) {
			return;
		}

		this._currentMessage.value = messageWithHighestRelevance;
		clearTimeout(this.currentMessageCloseTimeout);
		if (messageWithHighestRelevance?.autoCloseInSeconds !== undefined) {
			this.currentMessageCloseTimeout = setTimeout(this.closeCurrentMessage.bind(this), messageWithHighestRelevance.autoCloseInSeconds * 1000);
		}
	}
}

export type TrippyMood = "normal"|"angry"|"confused"|"suprised"|"tired";
export type BaseMessageInformation = {autoCloseInSeconds?: number, autoCloseEvenIfHidden: boolean, relevance: number, mood: TrippyMood, onClose?: (message: MessageInformation) => void};
export type TextMessageInformation = {type: "text", message: string}&BaseMessageInformation;
export type MessageInformation = TextMessageInformation;
export type TextMessageOptions = {message: string, autoCloseInSeconds?: number, autoCloseEvenIfHidden?: boolean, relevance?: number, mood?: TrippyMood, onClose?: () => void};