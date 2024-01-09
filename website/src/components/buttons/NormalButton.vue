<template>
	<router-or-button :route-to="routeTo" class="normal-button" :class="color ?? 'background2'" :type="type ?? 'button'">
		<slot></slot>
	</router-or-button>
</template>

<script setup lang="ts">
import { RouteLocationRaw } from 'vue-router';
import RouterOrButton from './RouterOrButton.vue';

defineProps<{
	color?: "background"|"background2"|"highlight";
	type?: "button"|"submit"|"reset";
	routeTo?: RouteLocationRaw;
}>();
</script>

<style scoped>

.normal-button {
	display: block;
	cursor: pointer;
	padding: 0.25em 0.5em;
	border-radius: 0.3em;
	color: inherit;
	white-space: nowrap;
	width: fit-content;
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

.normal-button:focus-within {
	outline: 2px solid var(--highlight);
}

.background {
	background-color: var(--background);
}

.background2 {
	background-color: var(--background2);
}

.highlight {
	background-color: var(--highlight);
	color: black;
}

.highlight:focus-within {
	outline: 2px solid var(--background2);
}

</style>