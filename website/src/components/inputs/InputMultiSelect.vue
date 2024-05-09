<template>
	<div class="input-holder">
		<input-label :label="props.name" :id="inputId" :required="required" v-model:error="error"/>
		<div class="multi-select">
			<select class="input-select" :id="inputId" :placeholder="placeholder" v-model="chosenValue">
				<template v-if="noneSelectedValuesWithDisplayType.groups">
					<optgroup v-for="group,index in noneSelectedValuesWithDisplayType.groups" :key="index" :label="group.name">
						<option v-for="value,index in group.values" :key="index" :value="value.value">{{value.name}}</option>
					</optgroup>
				</template>
				<template v-else>
					<option v-for="value,index in noneSelectedValuesWithDisplayType.values" :key="index" :value="value.value">{{value.name}}</option>
				</template>
			</select>
			<div class="selected-values">
				<button v-for="value of selectedValues" class="selected-value" @click="removeValue(value)">
					<slot name="selected" :value>{{value + ""}}</slot>
				</button>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts" generic="TValue">
import { computed, shallowRef, watch } from 'vue';
import InputLabel from './InputLabel.vue';
import { useFormInput } from '@/composables/use-form-input';
import { InputSelectValueType, InputSelectedGroupedValuesType } from '@/types/types';
import useElementId from '@/composables/use-element-id';

const props = defineProps<{
	values: ReadonlyArray<InputSelectValueType<TValue>>|ReadonlyArray<InputSelectedGroupedValuesType<TValue>>

	name?: string;
	id?: string;
	placeholder?: string;
	required?: boolean;
}>();

const selectedValues = defineModel<TValue[]>({default: []});

const error = shallowRef("");
const chosenValue = shallowRef<TValue>();

const inputId = useElementId(() => props.id);

watch(() => selectedValues.value, () => {
	error.value = "";
});

watch(() => chosenValue.value, () => {
	if (chosenValue.value) {
		selectedValues.value = [...selectedValues.value, chosenValue.value];

		// The value isn't correctly cleared if there isn't a delay.
		queueMicrotask(() => {
			chosenValue.value = undefined;
		});
	}
});

const noneSelectedValuesWithDisplayType = computed(() => {
	if (props.values.length > 0 && "values" in props.values[0]) {
		return {
			groups: (props.values as ReadonlyArray<InputSelectedGroupedValuesType<TValue>>)
				.map(group => ({
					name: group.name,
					values: group.values.filter(value => !selectedValues.value.includes(value.value))
				}))
				.filter(group => group.values.length > 0),
		}
	}

	return {
		values: (props.values as ReadonlyArray<InputSelectValueType<TValue>>)
			.filter(value => !selectedValues.value.includes(value.value)),
	}
});

function removeValue(value: TValue) {
	const newSelectedValues = [...selectedValues.value];

	const valueIndex = newSelectedValues.indexOf(value);
	if (valueIndex >= 0) {
		newSelectedValues.splice(valueIndex, 1);
	}

	selectedValues.value = newSelectedValues;
}

useFormInput({
	onValidateStart() {
		error.value = "";
	},
	onValidate() {
		const hasSelectedInvalidValues = selectedValues.value.some(selectedValue => {
			return !props.values.some(option => {
				if ("values" in option) {
					return option.values.some(groupItem => groupItem.value === selectedValue);
				} else {
					return option.value === selectedValue;
				}
			});
		})
		if (hasSelectedInvalidValues) {
			return {error: `${props.name ?? "Select"} has an invalid value.`}
		}
		
		if (props.required && selectedValues.value.length < 1) {
			return {error: `${props.name ?? "Select"} is required.`}
		}

		return true;
	},
	onError(errorMessage) {
		// Little delay to make old error dissapear
		queueMicrotask(() => {
			error.value = errorMessage
		});
	}
});
</script>

<style scoped>

.input-holder {
	display: flex;
	flex-flow: column;
	width: 100%;
}

.multi-select {
	position: relative;
	background-color: var(--background-input);
	color: var(--input-text-color);
	border-radius: 0.3rem;
	padding: 0.5rem 0.5rem;
	width: 100%;
	min-height: 45px;
	display: flex;
	align-items: center;
}

.input-select {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	border-radius: 0.3rem;
}

.input-select:focus {
	outline: 2px solid var(--highlight);
}

.required {
	color: var(--highlight);
	margin-left: 0.25rem;
}

.selected-values {
	position: relative;
	display: flex;
	gap: 0.25rem;
	flex-wrap: wrap;
	margin-right: 16px;
	pointer-events: none;
}

.selected-value {
	pointer-events: all;
	cursor: pointer;
	padding: 0;
}
</style>