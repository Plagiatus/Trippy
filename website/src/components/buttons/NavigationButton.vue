<template>
	<router-link v-if="routeTo" class="navigation-button" :to="routeTo">
		<slot></slot>
	</router-link>
	<button v-else class="navigation-button">
		<slot></slot>
	</button>
</template>

<script setup lang="ts">
import { RouteLocationRaw } from 'vue-router';

defineProps<{
	routeTo?: RouteLocationRaw
}>();
</script>

<style scoped>

.navigation-button {
	color: var(--text-color);
	padding: calc(0.25em - 2px) calc(0.5em - 2px);
	margin: 0 0.1em;
	text-decoration: none;
	border-radius: 0.3em;
	border: 2px solid transparent;
	cursor: pointer;
}

.navigation-button:hover {
	border: 2px solid var(--background);
}

.navigation-button:active,
.navigation-button.router-link-active {
	background-color: var(--background);
}

</style>