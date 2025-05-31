<template>
	<div class="display">
		<p class="title">{{title}}</p>
		<p class="value">{{value}}</p>
	</div>
</template>

<script setup lang="ts">
defineProps<{
	title: string
	value: number;
}>();
</script>

<style scoped>
.display {
	border: 2px solid var(--text-color);
	display: flex;
	flex-flow: column;
	gap: 1rem;
	padding: 1rem;
	border-radius: 4px;
	align-items: center;
	font-size: 0.8em;
}

.title {
	font-size: 1.2em;
}
</style>