import { Directive } from "vue"

const vValidateFormat: Directive<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement> = {
	mounted(inputElement) {
		inputElement.addEventListener("invalid", (event) => {
			inputElement.classList.add("perform-validation")
		}, false);
		
		inputElement.addEventListener("blur", (event) => {
			(inputElement).checkValidity();
		}, false);
	}
}

export default vValidateFormat;