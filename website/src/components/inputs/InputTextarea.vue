<template>
	<div class="input-holder">
		<input-label :label="props.name" :id="inputId" :required="required" v-model:error="data.error"/>
		<textarea
			class="textarea-input"
			v-model="value"
			:placeholder="placeholder"
			:id="inputId"
			:minlength="min"
			:maxlength="max"
			:rows="rows ?? 5"
		></textarea>
	</div>
</template>

<script setup lang="ts">
import { computed, shallowReactive, watch } from 'vue';
import InputLabel from './InputLabel.vue';
import { useFormInput } from '@/composables/use-form-input';

const props = defineProps<{
	modelValue: any;
	name?: string;
	id?: string;

	min?: number;
	max?: number;
	placeholder?: string;
	rows?: number;
	required?: boolean;
}>();

const emit = defineEmits<{
	(event: "update:modelValue", value: any): void;
}>()

const data = shallowReactive({
	error: "",
})

watch(() => props.modelValue, () => {
	data.error = "";
})

const value = computed<any>({
	get() {
		return props.modelValue
	},
	set(value) {
		data.error = "";
		emit("update:modelValue", value);
	}
})

const inputId = computed(() => props.id ?? btoa(Math.random().toString()).replace(/=/g,""))

useFormInput({
	onValidateStart() {
		data.error = "";
	},
	onValidate() {
		const hasValue = !(props.modelValue === undefined || props.modelValue === "");
		if (props.required && !hasValue) {
			return {error: `${props.name ?? "Text"} is required.`}
		}

		if (!hasValue) {
			return true;
		}

		if (props.min !== undefined && props.min > props.modelValue.length) {
			return {error: `${props.name ?? "Text"} needs to be atleast ${props.min} characters long.`}
		}

		if (props.max !== undefined && props.max < props.modelValue.length) {
			return {error: `${props.name ?? "Text"} needs to be less than ${props.max} characters long.`}
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

.textarea-input {
	background-color: var(--background-input);
	color: var(--input-text-color);
	border-radius: 0.3em;
	padding: 0.25em 0.5em;
	resize: vertical;
}

.textarea-input:focus {
	outline: 2px solid var(--highlight);
}

.required {
	color: var(--highlight);
	margin-left: 0.25em;
}
</style>