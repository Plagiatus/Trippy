<template>
	<div ref="holderRef" class="holder" @click="handleClick">
		<slot></slot>
	</div>
</template>

<script setup lang="ts">
import { shallowRef } from 'vue';

const holderRef = shallowRef<HTMLElement>();
const emit = defineEmits<{
	clickedOutside: [event: MouseEvent]
}>();

function handleClick(event: MouseEvent) {
	if (event.target === holderRef.value) {
		emit("clickedOutside", event);
	}
}
</script>

<style scoped>
.holder {
	z-index: 1;
	position: fixed;
	top: 0;
	left: 0;
	width: 100vw;
	height: 100vh;
	overflow: hidden;
	background-color: #00000040;

	display: flex;
	justify-content: center;
	align-items: center;
}
</style>