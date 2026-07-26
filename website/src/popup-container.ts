import { shallowReactive } from 'vue';

export type YesNoPopup = Readonly<{
	id: string;
	type: "yes-no";
	header?: string;
	yesText?: string;
	noText?: string;
	body: string;
	resolve: (result: boolean) => void;
}>;

export type MessagePopup = Readonly<{
	id: string;
	type: "message";
	header?: string;
	okText?: string;
	body: string;
	resolve: () => void;
}>;

export type Popup = YesNoPopup | MessagePopup;

export default class PopupContainer {
	private readonly _popups: Map<string, Popup>;
	private nextPopupId: number;

	public constructor() {
		this.nextPopupId = 0;
		this._popups = shallowReactive(new Map());
	}

	public get popups(): ReadonlyArray<Popup> {
		return Array.from(this._popups.values());
	}

	public displayYesNoDialog(options: { header?: string, body: string, yesText?: string, noText?: string }) {
		const { resolve, promise, popupId } = this.createPopupBase<boolean>();

		const popup: YesNoPopup = {
			id: popupId,
			type: 'yes-no',
			header: options.header,
			yesText: options.yesText,
			noText: options.noText,
			body: options.body,
			resolve: resolve
		};

		this._popups.set(popup.id, popup);

		return { promise };
	}

	public displayMessagePopup(options: { header?: string, body: string, okText?: string }) {
		const { resolve, promise, popupId } = this.createPopupBase<void>();

		const popup: MessagePopup = {
			id: popupId,
			type: 'message',
			header: options.header,
			okText: options.okText,
			body: options.body,
			resolve: resolve
		};

		this._popups.set(popup.id, popup);

		return { promise };
	}

	private createPopupBase<TResult>() {
		let resolveFunction: ((result: TResult) => void) | undefined;
		const promise = new Promise<TResult>((res) => resolveFunction = res);

		const popupId = `popup-${this.nextPopupId++}`;
		return {
			promise,
			resolve: (result: TResult) => {
				resolveFunction?.(result);
				this._popups.delete(popupId);
			},
			popupId,
		}
	}
}
