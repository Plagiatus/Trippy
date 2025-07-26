<template>
	<aside class="overlay">
		<div class="message-box" :class="{display: controller.currentMessage && controller.currentMessage === data.displayingMessage}">
			<div class="content">
				<template v-if="textMessageLines">
					<p v-for="line of textMessageLines">
						{{line}}&nbsp;<!--&nbsp; to allow empty lines.-->
					</p>
				</template>
				<component
					v-else-if="data.displayingMessage?.type === 'component'"
					:is="data.displayingMessage.message"
				/>
			</div>
			<button class="close" @click="closeMessage">Close</button>
		</div>
		<img class="trippy" :src="trippyImage" :class="{display: controller.currentMessage}"/>
	</aside>
</template>

<script setup lang="ts">
import useDependency from '@/composables/use-dependency';
import TrippyController from '@/trippy-controller';
import { computed, shallowReactive, watch } from 'vue';

const controller = useDependency(TrippyController);

const data = shallowReactive({
	displayingMessage: controller.currentMessage,
});
let switchMessageTimeout: number|undefined = undefined;

watch(() => controller.currentMessage, () => {
	clearTimeout(switchMessageTimeout);
	switchMessageTimeout = setTimeout(() => {
		data.displayingMessage = controller.currentMessage;
	}, 500);
});

const trippyImage = computed(() => {
	switch(controller.currentMessage?.mood) {
		case "angry":
			return "/trippy/angry.png";
		case "confused":
			return "/trippy/confused.png";
		case "normal":
		default:
			return "/trippy/normal.png";
		case "suprised":
			return "/trippy/suprised.png";
		case "tired":
			return "/trippy/tired.png";
	}
});

const textMessageLines = computed(() => {
	if (data.displayingMessage?.type !== "text") {
		return null;
	}

	const lines = data.displayingMessage.message.split("\n");
	return lines;
});

function closeMessage() {
	controller.closeCurrentMessage();
}
</script>

<style scoped>
.overlay {
	position: fixed;
	top: 0;
	left: 0;
	width: 100vw;
	height: 100vh;
	z-index: 1500;
	pointer-events: none;
	display: flex;
	justify-content: end;
	align-items: end;
	padding-top: 20px;
	padding-right: 120px;
	padding-bottom: 180px;
	padding-left: 20px;
}

.trippy {
	width: 180px;
	height: 180px;
	object-fit: contain;
	position: fixed;
	bottom: 30px;
	right: 0;
	opacity: 0;
	transform-origin: bottom center;
	transform: rotate(135deg);
	transition: opacity 0.2s, transform 0.5s;
	animation: trippy 1s infinite ease-in-out alternate-reverse;
}

.trippy.display {
	opacity: 1;
	transform: rotate(10deg);
}

.message-box {
	display: flex;
	flex-flow: column;
	align-items: end;
	padding: 10px;
	border: 4px solid var(--highlight);
	background-color: var(--background2);
	border-radius: 16px;
	width: fit-content;
	height: fit-content;
	position: relative;
	transform-origin: bottom right;
	transform: scale(0);
	pointer-events: all;
	transition: transform 0.2s;
}

.message-box.display {
	transform: scale(1);
}

.content {
	overflow: auto;
}

.message-box::after {
	content: "";
	display: block;
	border-top: 32px solid var(--highlight);
	border-left: 32px solid transparent;
	position: absolute;
	right: 5px;
	bottom: 0;
	transform: translateY(100%);
}

.close {
	margin-top: 8px;
	text-decoration: underline;
	color: currentColor;
	cursor: pointer;
}

@keyframes trippy {
	0% {
		bottom: 30px;
	}
	100% {
		bottom: 35px;
	}
}
</style>