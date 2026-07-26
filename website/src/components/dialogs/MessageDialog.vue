<template>
	<dialog-holder @clicked-outside="close()">
		<content-box :header="header" class="dialog">
			<div class="body">
				<slot></slot>
			</div>
			<div class="buttons">
				<normal-button class="button" color="highlight" @click="close()">
					{{ okText ?? 'Ok' }}
				</normal-button>
			</div>
		</content-box>
	</dialog-holder>
</template>

<script setup lang="ts">
import ContentBox from '../ContentBox.vue';
import DialogHolder from './DialogHolder.vue';
import NormalButton from '../buttons/NormalButton.vue';

const props = defineProps<{
	header?: string;
	okText?: string;
}>();

const emit = defineEmits<{
	close: [];
}>();

function close() {
	emit('close');
}
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
