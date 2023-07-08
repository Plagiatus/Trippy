<template>
	<div class="input-label">
		<label v-if="props.label !== undefined" :for="id">{{props.label}}:</label>
		<span v-if="required" class="required">*</span>
		<error-display type="small" hide-close-icon @close="clearError">
			<p v-if="error">{{error}}</p>
		</error-display>
	</div>
</template>

<script setup lang="ts">
import ErrorDisplay from '../ErrorDisplay.vue';

const props = defineProps<{
	label?: string;
	id?: string;
	required?: boolean;
	error?: string;
}>();

const emit = defineEmits<{
	(event: "update:error", empty: ""): void;
}>();

function clearError() {
	emit("update:error", "");
}
</script>
<style scoped>

.input-label {
	display: flex;
	align-items: center;
	gap: 0.25em;
}

.required {
	color: var(--highlight);
}
</style>