<template>
	<transition
		@enter="startEnterTransition"
		@leave="startLeaveTransition"
	>
		<slot :attrs="$attrs"></slot>
	</transition>
</template>

<script lang="ts">
// Have to turn off inheritAttrs so no attributes are given to transition.
// All attributes are instead added as a slot prop.
// This means you will manually have to get the attributes '#default="{attrs}"' and then set them on the component 'v-bind="attrs"'.
// This is to work around this bug:
// https://github.com/vuejs/core/issues/3716
export default {
	inheritAttrs: false,
}
</script>
<script setup lang="ts">
const props = defineProps<{
	transitionTime?: number;
	transitionWidth?: boolean;
	transitionHeight?: boolean;
}>();

function startEnterTransition(element: Element, finishCallback: () => void) {
	if (!("style" in element)) {
		return;
	}
	const htmlElement = element as HTMLElement;
	
	const totalAnimationTime = props.transitionTime ?? 200;
	const startTime = performance.now();
	const width = htmlElement.clientWidth;
	const height = htmlElement.clientHeight;

	const transitionWidth = props.transitionWidth ?? false;
	const transitionHeight = props.transitionHeight === false && props.transitionWidth === false ? true : props.transitionHeight;

	if (transitionWidth) {
		htmlElement.style.width = "0";
	}
	if (transitionHeight) {
		htmlElement.style.height = "0";
	}
	htmlElement.style.overflow = "hidden";

	function animateFrame() {
		requestAnimationFrame((time) => {
			const atTime = time - startTime;

			if (atTime >= totalAnimationTime) {
				htmlElement.style.overflow = "";
				htmlElement.style.height = "";
				htmlElement.style.width = "";
				finishCallback();
				return;
			}

			const percentageDone = atTime / totalAnimationTime;
			if (transitionWidth) {
				htmlElement.style.width = `${width * percentageDone}px`;
			}
			if (transitionHeight) {
				htmlElement.style.height = `${height * percentageDone}px`;
			}
			animateFrame();
		});
	}
	animateFrame();
}

function startLeaveTransition(element: Element, finishCallback: () => void) {
	if (!("style" in element)) {
		return;
	}
	const htmlElement = element as HTMLElement;
	
	const totalAnimationTime = props.transitionTime ?? 200;
	const startTime = performance.now();
	const width = htmlElement.clientWidth;
	const height = htmlElement.clientHeight;

	const transitionWidth = props.transitionWidth ?? false;
	const transitionHeight = props.transitionHeight === false && props.transitionWidth === false ? true : props.transitionHeight;

	if (transitionWidth) {
		htmlElement.style.width = "0";
	}
	if (transitionHeight) {
		htmlElement.style.height = "0";
	}
	htmlElement.style.overflow = "hidden";

	function animateFrame() {
		requestAnimationFrame((time) => {
			const atTime = time - startTime;

			if (atTime >= totalAnimationTime) {
				finishCallback();
				return;
			}

			const percentageDone = 1 - atTime / totalAnimationTime;
			if (transitionWidth) {
				htmlElement.style.width = `${width * percentageDone}px`;
			}
			if (transitionHeight) {
				htmlElement.style.height = `${height * percentageDone}px`;
			}
			animateFrame();
		});
	}
	animateFrame();
}
</script>