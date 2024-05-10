<template>
	<div class="input-with-label" v-if="props.name !== undefined">
		<label :for="inputId">{{props.name}}:</label>
		<input
			v-model="value"
			class="input-checkbox"
			type="checkbox"
			:id="inputId"
		>
	</div>
	<input
		v-else
		v-model="value"
		class="input-checkbox"
		type="checkbox"
		:id="inputId"
	>
</template>

<script setup lang="ts">
import useElementId from '@/composables/use-element-id';
import { computed } from 'vue';

const props = defineProps<{
	modelValue?: boolean|undefined|null;
	name?: string;
	id?: string;
}>();

const emit = defineEmits<{
	(event: "update:modelValue", value: boolean): void;
}>()

const value = computed({
	get() {
		return props.modelValue ?? false;
	},
	set(value) {
		emit("update:modelValue", value);
	}
})

const inputId = useElementId(() => props.id);
</script>

<style scoped>
.input-with-label {
	display: flex;
	align-items: center;
}

.input-checkbox {
	width: 16px;
	height: 16px;
	background-color: var(--background-input);
}

.input-checkbox:focus-visible {
	outline: 2px solid var(--highlight);
}

.input-with-label>.input-checkbox {
	margin-left: 0.25em;
}
</style>