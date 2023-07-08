<template>
	<content-box header="Session">
		<input-checkbox v-model="sessionBlueprint.ping" name="Ping" class="input-row"/>
		<p>Voice Channels:</p>
		<div class="add-voice-channel">
			<validateable-form-provider :form="voiceChannelForm">
				<input-field
					class="channel-name-input"
					v-model="data.newVoiceChannelName"
					type="text"
					placeholder="Name"
					name="Name"
					hide-label
					:min="1"
					:max="16"
					pattern="^[a-z0-9_\- A-Z]+$"
				/>
			</validateable-form-provider>
			<normal-button color="background" :disabled="!data.newVoiceChannelName" @click="addVoiceChannel">Add</normal-button>
		</div>
		<div class="voice-channels-holder">
			<div v-for="voiceChannel,index of sessionBlueprint.voiceChannels" class="voice-channel" @click="removeVoiceChannel(index)">
				{{voiceChannel.name}}
				<img class="remove-channel" src="/icons/cross.svg"/>
			</div>
		</div>
	</content-box>
</template>

<script setup lang="ts">
import InputField from '@/components/inputs/InputField.vue';
import InputCheckbox from '@/components/inputs/InputCheckbox.vue';
import { PartialSessionBlueprint } from '@/types/session-blueprint-types';
import { shallowReactive } from 'vue';
import ContentBox from '../ContentBox.vue';
import NormalButton from '../buttons/NormalButton.vue';
import ValidateableForm from '@/validateable-form';
import ValidateableFormProvider from '../ValidateableFormProvider.vue';

const props = defineProps<{
	sessionBlueprint: PartialSessionBlueprint;
}>()

const data = shallowReactive({
	newVoiceChannelName: "",
});

const voiceChannelForm = new ValidateableForm();

function addVoiceChannel() {
	if (!voiceChannelForm.validateForm()) {
		return;
	}

	props.sessionBlueprint.voiceChannels.push({name: data.newVoiceChannelName.toLowerCase().replace(/ /g, "-")})
	data.newVoiceChannelName = "";
}

function removeVoiceChannel(index: number) {
	props.sessionBlueprint.voiceChannels.splice(index, 1);
}
</script>

<style scoped>
.input-row:not(:last-child) {
	margin-bottom: 1em;
}

.add-voice-channel {
	display: flex;
	align-items: center;
}

.channel-name-input {
	flex-grow: 1;
	margin-right: 1em;
}

.voice-channels-holder {
	display: flex;
	flex-wrap: wrap;
}

.voice-channel {
	display: flex;
	align-items: center;
	cursor: pointer;
	border: 2px solid var(--background);
	padding: 0.25em 0.5em;
	border-radius: 0.5em;
	margin: 0.25em;
}

.remove-channel {
	visibility: hidden;
	width: 0.75em;
	height: 0.75em;
	margin-left: 0.25em;
	filter: var(--text-color-filter);
}

.voice-channel:hover>.remove-channel {
	visibility: visible;
}
</style>