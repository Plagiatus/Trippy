import { Directive } from "vue"

const vRequiredWithStar: Directive<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement> = {
    mounted(inputElement) {
        if (!inputElement.id) {
            return;
        }
        inputElement.required = true;
        const label = document.querySelector(`label[for="${inputElement.id}"]`);
        label?.classList.add("required");
    }
}

export default vRequiredWithStar;