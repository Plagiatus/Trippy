<template>
	<div class="spinner" :style="sizeStyle"></div>
</template>

<script setup lang="ts">
import { StyleValue, computed } from 'vue';

const props = defineProps<{
	size?: number;
}>();

const sizeStyle = computed<StyleValue>(() => {
	const sizeWithPixels = `${props.size ?? 100}px`;
	return {
		width: sizeWithPixels,
		height: sizeWithPixels,
	}
})
</script>

<style scoped>

.spinner {
	border: 10px solid var(--background2);
	border-top: 10px solid var(--text-color);
	border-radius: 100%;
	animation: rotate 2s linear infinite;
}

@keyframes rotate {
	0% { transform: rotate(0deg); }
	100% { transform: rotate(360deg); }
}

</style>