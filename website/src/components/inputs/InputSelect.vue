<template>
	<div class="input-holder">
		<input-label :label="props.name" :id="inputId" :required="required" v-model:error="data.error"/>
		<select class="input-select" :id="inputId" v-model="value" :placeholder="placeholder">
			<template v-if="getValuesWithDisplayType.groups">
				<optgroup v-for="group,index in getValuesWithDisplayType.groups" :key="index" :label="group.name">
					<option v-for="value,index in group.values" :key="index" :value="value.value">{{value.name}}</option>
				</optgroup>
			</template>
			<template v-else>
				<option v-for="value,index in getValuesWithDisplayType.values" :key="index" :value="value.value">{{value.name}}</option>
			</template>
		</select>
	</div>
</template>

<script setup lang="ts">
import { computed, shallowReactive, watch } from 'vue';
import InputLabel from './InputLabel.vue';
import { useFormInput } from '@/composables/use-form-input';

const props = defineProps<{
	modelValue: any;
	values: ReadonlyArray<InputSelectValueType<any>>|ReadonlyArray<InputSelectedGroupedValuesType<any>>

	name?: string;
	id?: string;
	placeholder?: string;
	required?: boolean;
}>();

const emit = defineEmits<{
	(event: "update:modelValue", value: any): void;
}>();

const data = shallowReactive({
	error: "",
})

watch(() => props.modelValue, () => {
	data.error = "";
})

const getValuesWithDisplayType = computed(() => {
	if (props.values.length > 0 && "values" in props.values[0]) {
		return {
			groups: props.values as ReadonlyArray<InputSelectedGroupedValuesType<any>>,
		}
	}

	return {
		values: props.values as ReadonlyArray<InputSelectValueType<any>>,
	}
});

const value = computed({
	get() {
		return props.modelValue;
	},
	set(value) {
		data.error = "";
		emit("update:modelValue", value);
	}
});

const inputId = computed(() => props.id ?? btoa(Math.random().toString()).replace(/=/g,""))

useFormInput({
	onValidateStart() {
		data.error = "";
	},
	onValidate() {
		const hasSelectedValidValue = props.values.some(option => {
			if ("values" in option) {
				return option.values.some(groupItem => groupItem.value === value.value);
			} else {
				return option.value === value.value;
			}
		});
		if (props.required && !hasSelectedValidValue) {
			return {error: `${props.name ?? "Select"} is required.`}
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

.input-select {
	background-color: var(--background-input);
	color: var(--input-text-color);
	border-radius: 0.3em;
	padding: 0.5em 0.5em;
}

.input-select:focus {
	outline: 2px solid var(--highlight);
}

.required {
	color: var(--highlight);
	margin-left: 0.25em;
}
</style>