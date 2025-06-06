import { validateableFormInjectionKey } from "@/injection-keys";
import { FormInputInformation } from "@/validateable-form";
import { inject } from "vue";

export function useFormInput(inputInformation: FormInputInformation) {
	const form = inject(validateableFormInjectionKey, undefined);
	if (!form) {
		return;
	}

	form.addInput(inputInformation);
}