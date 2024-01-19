<template>
	<dialog-holder v-if="data.resolve" @clicked-outside="select(false)">
		<content-box :header="header" class="dialog">
			<div class="body">
				<slot></slot>
			</div>
			<div class="buttons">
				<normal-button class="button" color="highlight" @click="select(false)">
					{{noText ?? "No"}}
				</normal-button>
				<normal-button class="button" color="highlight" @click="select(true)">
					{{yesText ?? "Yes"}}
				</normal-button>
			</div>
		</content-box>
	</dialog-holder>
</template>

<script setup lang="ts">
import { shallowReactive } from 'vue';
import ContentBox from '../ContentBox.vue';
import DialogHolder from './DialogHolder.vue';
import NormalButton from '../buttons/NormalButton.vue';

defineProps<{
	header?: string;
	noText?: string;
	yesText?: string;
}>();

const data = shallowReactive({
	resolve: null as null | ((result: boolean) => void),
});

function openDialog() {
	return new Promise<boolean>((res) => {
		data.resolve = res;
	})
}

function select(value: boolean) {
	data.resolve?.(value);
	data.resolve = null;
}

defineExpose({
	openDialog
});
</script>

<style scoped>
.dialog {
	display: flex;
	flex-flow: column;
	max-width: 450px;
}

.body {
	margin-bottom: 32px;
}

.buttons {
	width: 100%;
	display: flex;
	gap: 32px;
	justify-content: center;
}

.button {
	padding-left: 32px;
	padding-right: 32px;
}
</style>