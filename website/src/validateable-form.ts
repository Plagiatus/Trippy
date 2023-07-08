import { getCurrentInstance, onUnmounted } from "vue";

export type FormInputInformation = {
	onValidateStart?(): void;
	onValidate(): boolean|{error: string};
	onError?(error: string): void;
}

export default class ValidateableForm {
	private readonly inputs: FormInputInformation[];

	public constructor() {
		this.inputs = [];
	}

	public addInput(inputInformation: FormInputInformation) {
		if (!getCurrentInstance()) {
			throw new Error("addInput can only be called during setup() in a component");
		}

		this.inputs.push(inputInformation);
		onUnmounted(() => {
			const index = this.inputs.indexOf(inputInformation);
			this.inputs.splice(index, 1);
		})
	}

	public validateForm(): boolean {
		let isValid = true;

		for (const input of this.inputs) {
			input.onValidateStart?.();
		}

		for (const input of this.inputs) {
			const result = input.onValidate();
			if (typeof result === "object") {
				isValid = false;
				input.onError?.(result.error);
			} else if (!isValid) {
				isValid = false;
			}
		}

		return isValid;
	}
}