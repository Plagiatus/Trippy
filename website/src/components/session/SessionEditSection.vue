<template>
	<content-box header="Session">
		<transition-size v-if="data.canPingInMilliseconds !== null && !isEditingSession">
			<input-checkbox v-if="forceAllowPinging || (data.canPingInMilliseconds ?? 1) <= 0" v-model="sessionBlueprint.ping" name="Ping" class="input-row"/>
			<div v-else class="ping-timer-message">You can ping again in <span class="ping-timer">{{formattedPingTimer}}</span>.</div>
		</transition-size>
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
import { computed, shallowReactive, watchEffect } from 'vue';
import ContentBox from '../ContentBox.vue';
import NormalButton from '../buttons/NormalButton.vue';
import ValidateableForm from '@/validateable-form';
import ValidateableFormProvider from '../ValidateableFormProvider.vue';
import TransitionSize from '../TransitionSize.vue';
import useProvidedItem from '@/composables/use-provided-item';
import TimeHelper from '@/time-helper';
import SessionApiClient from '@/api-clients/session-api-client';
import useLoadData from '@/composables/use-load-data';

const props = defineProps<{
	sessionBlueprint: PartialSessionBlueprint;
	isEditingSession?: boolean;
	forceAllowPinging?: boolean;
}>()

const voiceChannelForm = new ValidateableForm();
const timeHelper = useProvidedItem(TimeHelper);
const sessionApiClient = useProvidedItem(SessionApiClient);

const data = shallowReactive({
	newVoiceChannelName: "",
	canPingInMilliseconds: null as null|number,
	totalPingCooldownInMilliseconds: null as null|number,
});

const pingCooldown = useLoadData(() => sessionApiClient.getMillisecondsTillBeingAbleToPing())

watchEffect(async (cleanup) => {
	const beginningPingDelay = pingCooldown.data?.millisecondsTillNextPing ?? null;
	data.canPingInMilliseconds = beginningPingDelay;
	if (beginningPingDelay === null || beginningPingDelay <= 0) {
		return;
	}

	const pingTimerStartedAt = timeHelper.currentDate.getTime();
	const interval = setInterval(() => {
		data.canPingInMilliseconds = beginningPingDelay - (timeHelper.currentDate.getTime() - pingTimerStartedAt);
	}, 1000);

	cleanup(() => {
		clearInterval(interval);
	});
});

const formattedPingTimer = computed(() => {
	if (data.canPingInMilliseconds === null) {
		return "never";
	}

	const totalSeconds = Math.ceil(data.canPingInMilliseconds / 1000);
	const seconds = totalSeconds % 60;
	const totalMinutes = Math.floor(totalSeconds / 60);
	const minutes = totalMinutes % 60;
	const totalHours = Math.floor(totalMinutes / 60);

	return `${totalHours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
});

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

.ping-timer {
	color: var(--highlight);
	font-weight: bold;
}

.ping-timer-message {
	margin-bottom: 1em;
}
</style>