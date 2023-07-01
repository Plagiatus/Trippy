<template>
	<button class="normal-button" :class="color ?? 'background2'" :type="type ?? 'button'">
		<slot></slot>
	</button>
</template>

<script setup lang="ts">
defineProps<{
	color?: "background"|"background2"|"highlight";
	type?: "button"|"submit"|"reset";
}>();
</script>

<style scoped>

.normal-button {
	display: block;
	cursor: pointer;
	padding: 0.25em 0.5em;
	border-radius: 0.3em;
	color: inherit;
}

.normal-button:hover {
	filter: brightness(1.2);
}

.normal-button:active {
	filter: brightness(0.8);
}

.normal-button:disabled {
	filter: brightness(0.8);
	cursor: default;
}

.background {
	background-color: var(--background);
}

.background2 {
	background-color: var(--background2);
}

.highlight {
	background-color: var(--highlight);
}

</style>