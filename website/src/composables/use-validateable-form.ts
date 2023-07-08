import { validateableFormInjectionKey } from "@/injection-keys";
import ValidateableForm from "@/validateable-form";
import { provide } from "vue";

export function useValidateableForm(form?: ValidateableForm) {
	const validateableForm = form ?? new ValidateableForm();
	provide(validateableFormInjectionKey, validateableForm);
	return validateableForm;
}