<template>
	<div class="input-holder">
		<input-label :label="hideLabel ? undefined : props.name" :id="inputId" :required="required" v-model:error="data.error"/>
		<input
			v-model="value"
			class="input-field"
			:type="type"
			:id="inputId"
			:min="type === 'number' ? min : undefined"
			:max="type === 'number' ? max : undefined"
			:minlength="type === 'text' ? min : undefined"
			:maxlength="type === 'text' ? max : undefined"
			:placeholder="placeholder"
			:readonly="readonly"
		>
	</div>
</template>

<script setup lang="ts">
import { useFormInput } from '@/composables/use-form-input';
import { computed, shallowReactive, watch } from 'vue';
import InputLabel from './InputLabel.vue';

const props = defineProps<{
	type: "text"|"number";
	modelValue: any;
	name?: string;
	id?: string;

	min?: number;
	max?: number;
	placeholder?: string;
	readonly?: boolean;
	required?: boolean;
	pattern?: string;
	hideLabel?: boolean;
}>();

const data = shallowReactive({
	error: "",
})

const emit = defineEmits<{
	(event: "update:modelValue", value: any): void;
}>();

watch(() => props.modelValue, () => {
	data.error = "";
})

const value = computed<any>({
	get() {
		return props.modelValue
	},
	set(value) {
		data.error = "";
		if (props.type === "number") {
			if (value === "") {
				emit("update:modelValue", undefined);
			} else {
				const asNumber = Number(value);
				emit("update:modelValue", asNumber);
			}
		} else {
			emit("update:modelValue", value);
		}
	}
})

const inputId = computed(() => props.id ?? btoa(Math.random().toString()).replace(/=/g,"").toLowerCase());

useFormInput({
	onValidateStart() {
		data.error = "";
	},
	onValidate() {
		const hasValue = !(props.modelValue === undefined || props.modelValue === "");
		if (props.required && !hasValue) {
			return {error: `${props.name ?? "Field"} is required.`}
		}

		if (!hasValue) {
			return true;
		}

		if (props.min !== undefined) {
			if (props.type === "text" && props.min > props.modelValue.length) {
				return {error: `${props.name ?? "Field"} needs to be atleast ${props.min} characters long.`}
			} else if (props.type === "number" && props.min > props.modelValue) {
				return {error: `${props.name ?? "Field"} needs to be greater than or equal to ${props.min}.`}
			}
		}

		if (props.max !== undefined) {
			if (props.type === "text" && props.max < props.modelValue.length) {
				return {error: `${props.name ?? "Field"} needs to be less than ${props.max} characters long.`}
			} else if (props.type === "number" && props.max < props.modelValue) {
				return {error: `${props.name ?? "Field"} needs to be less than or equal to ${props.max}.`}
			}
		}

		if (props.pattern !== undefined) {
			const regExp = new RegExp(props.pattern);
			if (!regExp.test(props.modelValue)) {
				return {error: `${props.name ?? "Field"} is invalid.`}
			}
		}

		return true;
	},
	onError(error) {
		// Little delay to make old error dissapear
		Promise.resolve().then(() => data.error = error);
	}
});
</script>

<style scoped>

.input-holder {
	display: flex;
	flex-flow: column;
	width: 100%;
}

.input-field {
	background-color: var(--background-input);
	color: var(--input-text-color);
	border-radius: 0.3em;
	padding: 0.25em 0.5em;
}

.input-field:focus {
	outline: 2px solid var(--highlight);
}
</style>