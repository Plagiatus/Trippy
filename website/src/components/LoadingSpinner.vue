<template>
	<div class="spinner" :class="color ?? 'background2'" :style="sizeStyle"></div>
</template>

<script setup lang="ts">
import { StyleValue, computed } from 'vue';

const props = defineProps<{
	size?: number;
	color?: "background"|"background2"|"highlight";
}>();

const sizeStyle = computed<StyleValue>(() => {
	const size = props.size ?? 5;
	const sizeWithEm = `${size}em`;

	return {
		width: sizeWithEm,
		height: sizeWithEm,
		borderWidth: `${size / 5}em`,
	}
});
</script>

<style scoped>

.spinner {
	border-color: var(--text-color);
	border-style: solid;
	border-radius: 100%;
	animation: rotate 1s linear infinite;
}

.background {
	border-top-color: var(--background);
}

.background2 {
	border-top-color: var(--background2);
}

.highlight {
	border-top-color: var(--highlight);
}

@keyframes rotate {
	0% { transform: rotate(0deg); }
	100% { transform: rotate(360deg); }
}

</style>