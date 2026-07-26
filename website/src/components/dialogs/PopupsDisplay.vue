<template>
	<template v-for="popup in popupService.popups" :key="popup.id">
		<yes-no-dialog
			v-if="popup.type === 'yes-no'"
			:header="popup.header"
			:yesText="popup.yesText"
			:noText="popup.noText"
			@select="popup.resolve($event)"
		>
			{{ popup.body }}
		</yes-no-dialog>
		<message-dialog
			v-else-if="popup.type === 'message'"
			:header="popup.header"
			:okText="popup.okText"
			@close="popup.resolve()"
		>
			{{ popup.body }}
		</message-dialog>
	</template>
</template>

<script setup lang="ts">
import useDependency from '@/composables/use-dependency';
import PopupContainer from '@/popup-container.js';
import YesNoDialog from './YesNoDialog.vue';
import MessageDialog from './MessageDialog.vue';

const popupService = useDependency(PopupContainer);
</script>
