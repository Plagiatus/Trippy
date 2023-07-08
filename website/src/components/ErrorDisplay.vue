<template>
	<transition-size>
		<template #default="{attrs}">
			<section v-if="isDisplayingError" @click="closeError" v-bind="attrs">
				<div class="error-display" :class="type ?? 'normal'">
					<div>
						<slot>

						</slot>
					</div>
					<img v-if="!hideCloseIcon" class="close-icon" src="/icons/cross.svg"/>
				</div>
			</section>
		</template>
	</transition-size>
</template>

<script setup lang="ts">
import TransitionSize from './TransitionSize.vue';
import useSlotIsRenderingComponent from '@/composables/use-slot-is-rendering-component';

defineProps<{
	hideCloseIcon?: boolean;
	type?: "normal"|"small";
}>();

const emit = defineEmits<{
	(event: "close"): void;
}>();

const isDisplayingError = useSlotIsRenderingComponent();

function closeError() {
	emit("close");
}
</script>

<style scoped>
.error-display {
	background-color: var(--background-error);
	border-radius: 0.3em;
	display: flex;
	justify-content: space-between;
	cursor: pointer;
}

.normal {
	padding: 0.25em 0.5em;
}

.small {
	padding: 0.125em 0.25em;
	font-size: 0.75em;
}

.close-icon {
	filter: var(--text-color-filter);
}

.normal>.close-icon {
	width: 1em;
	height: 1em;
	margin-left: 1em;
	margin-top: 0.25em;
}

.small>.close-icon {
	width: 0.75em;
	height: 0.75em;
	margin-left: 0.5em;
	margin-top: 0.375em;
}
</style>