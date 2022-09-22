import { defineComponent } from "vue";


export default defineComponent({
    name: "form-utils",
    methods: {
        addRequiredStar(){
            let labels = document.getElementsByTagName("label");
            let formElements = document.querySelectorAll("input, textarea, select");
            let labelMap = new Map<string, HTMLLabelElement>();
            for(let i: number = 0; i < labels.length; i++){
                labelMap.set(labels[i].htmlFor, labels[i]);
            }
            
            formElements.forEach((elem) => {
                if((<HTMLInputElement>elem).required) {
                    let label = labelMap.get(elem.id);
                    if(label) {
                        label.classList.add("required");
                    }
                }
            })
        },
        addValidationFormat(){
            let formElements = document.querySelectorAll("input, textarea, select");
            for(let i: number = 0; i < formElements.length; i++){
                formElements[i].addEventListener("invalid", (event)=> {
                    formElements[i].classList.add("perform-validation")
                }, false);
                formElements[i].addEventListener("blur", (event)=> {
                    (<HTMLInputElement>formElements[i]).checkValidity();
                }, false);
            }
        }
    },
    mounted(){
        this.addRequiredStar();
        this.addValidationFormat();
    }
});