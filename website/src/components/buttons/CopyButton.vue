<template>
	<button type="button" class="copy-button" @click="copyData">
		<img class="copy-icon" :src="data.displayConfirmation ? '/icons/checkmark.svg': '/icons/copy.svg'" alt="Copy">
	</button>
</template>

<script setup lang="ts">
import { shallowReactive } from "vue";

const props = defineProps<{
	value: string
}>();

const data = shallowReactive({
	textHideTimeout: null as null|number,
	displayConfirmation: false,
})

function copyData() {
	navigator.clipboard.writeText(props.value);
	if (data.textHideTimeout) {
		clearTimeout(data.textHideTimeout);
	}
	data.displayConfirmation = true;
	data.textHideTimeout = setTimeout(() => {
		data.displayConfirmation = false;
	}, 1000);
}
</script>

<style scoped>
.copy-button {
	cursor: pointer;
}

.copy-icon {
	width: 1em;
	height: 1em;
	filter: var(--text-color-filter);
}
</style>