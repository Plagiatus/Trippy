<template>
	<normal-button
		class="loading-button"
		:class="{'loading': loading, 'success': data.success}"
		:disabled="loading || disabled"
		:type="type"
		:color="color"
	>
		<span class="text">{{text}}</span>
		<span class="success-text">{{successText}}</span>
		<loading-spinner v-if="loading" class="loading-spinner" :size="1" :color="loadingSpinnerColor"/>
	</normal-button>
</template>

<script setup lang="ts">
import { computed, shallowReactive, watch } from 'vue';
import NormalButton from './NormalButton.vue';
import LoadingSpinner from '../LoadingSpinner.vue';

const props = defineProps<{
	text: string;
	loading: boolean;
	successText?: string;
	disabled?: boolean;
	type?: "button"|"submit"|"reset";
	color?: "background"|"background2"|"highlight";
}>();

const data = shallowReactive({
	success: false,
	successClearTimeout: null as null|number,
});

const loadingSpinnerColor = computed(() => {
	if (props.color === "background") {
		return "background2";
	}
	if (props.color === "background2" || props.color === undefined) {
		return "highlight";
	}
	return "background";
})

watch(() => props.loading, () => {
	if (props.loading) {
		return;
	}

	data.successClearTimeout !== null && clearTimeout(data.successClearTimeout);

	if (props.successText === undefined) {
		data.success = false;
		return;
	}

	data.success = true;
	data.successClearTimeout = setTimeout(() => {
		data.success = false;
	}, 1000);
});
</script>

<style scoped>
.loading-button {
	position: relative;
	display: flex;
	flex-flow: column;
	align-items: center;
}

.text {
	opacity: 1;
}

.success>.text {
	opacity: 0;
	height: 0;
	pointer-events: none;
}
.loading>.text {
	opacity: 0;
	pointer-events: none;
}

.success-text {
	opacity: 0;
	height: 0;
	pointer-events: none;
}

.success>.success-text {
	opacity: 1;
	height: auto;
}

.loading-spinner {
	position: absolute;
	top: 50%;
	left: 50%;
	margin-top: -.5em;
	margin-left: -.5em;
}
</style>