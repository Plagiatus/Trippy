<template>
	<router-or-button class="big-icon-button" :to="routeTo">
		<img class="image" :src="icon" alt="Show feedback">
		<span class="title">{{title}}</span>
	</router-or-button>
</template>

<script setup lang="ts">
import { RouteLocationRaw } from 'vue-router';
import RouterOrButton from './RouterOrButton.vue';

defineProps<{
	title: string;
	icon: string;
	routeTo?: RouteLocationRaw
}>();
</script>

<style scoped>

.big-icon-button {
	min-width: 500px;
	text-decoration: none;
	color: var(--text-color);
	margin: 2rem;
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 2em;
	border-radius: 2em;
	cursor: pointer;
}

.big-icon-button:hover {
	background-color: var(--background2);
}

.image {
	filter: var(--text-color-filter);
	width: 200px;
}

.title {
	font-size: 2em;
	font-weight: bold;
}

</style>