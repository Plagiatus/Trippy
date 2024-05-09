<template>
	<content-box header="Expectations">
		<input-select v-model="playType" :values="sessionTypeOptions" name="Need help with" class="input-row" required/>
		<input-select v-model="sessionBlueprint.preferences.communication" :values="communicationOptions" name="Communication" class="input-row"/>
		<input-select v-model="sessionBlueprint.preferences.newPlayers" :values="mapExperienceOptions" name="Experience" class="input-row"/>
		<input-field v-model="sessionBlueprint.preferences.timeEstimate" type="number" name="Time Estimate (In hours)" class="input-row"/>
		<div class="input-row">
			<p>Players</p>
			<div class="players-count-row">
				<input-field class="players-count-input" v-model="sessionBlueprint.preferences.players.min" type="number" placeholder="Minimum needed" :min="0" :max="sessionBlueprint.preferences.players.max"/>
				<input-field class="players-count-input" v-model="sessionBlueprint.preferences.players.max" type="number" placeholder="Maximum supported" :min="1"/>
			</div>
		</div>
	</content-box>
</template>

<script setup lang="ts">
import InputField from '@/components/inputs/InputField.vue';
import InputSelect from '@/components/inputs/InputSelect.vue';
import { PartialSessionBlueprint, SessionBlueprint, SessionType } from '$/types/session-blueprint-types';
import ContentBox from '../ContentBox.vue';
import { InputSelectValueType } from '@/types/types';
import useLoadData from '@/composables/use-load-data';
import useDependency from '@/composables/use-dependency';
import SettingsApiClient from '@/api-clients/settings-api-client';
import { computed } from 'vue';
import useTrippyMessage from '@/composables/use-trippy-message';

const props = defineProps<{
	sessionBlueprint: PartialSessionBlueprint;
}>();

const settingsApiClient = useDependency(SettingsApiClient);
const multipliersResponse = useLoadData(() => settingsApiClient.getPlayTypeMultipliers());
const multiplierWarningMessage = useTrippyMessage();

const playType = computed({
	get() {
		return props.sessionBlueprint.type;
	},
	set(value: SessionType|undefined) {
		if (props.sessionBlueprint.type === value) {
			return;
		}

		props.sessionBlueprint.type = value;
		const typeInformation = sessionTypeOptions.find(type => type.value === value);
		if (!typeInformation) {
			return;
		}

		multiplierWarningMessage.closeMessage();
		const multiplier = multipliersResponse.data?.[typeInformation.value] ?? 1;
		if (multiplier === 0) {
			multiplierWarningMessage.displayText({
				message: `No one will be gaining recommendation\nwhen selecting "${typeInformation.name}".`,
				autoCloseInSeconds: 15,
				relevance: 15,
			});
		} else if (multiplier < 0) {
			multiplierWarningMessage.displayText({
				message: `Everyone will lose recommendation\nwhen selecting "${typeInformation.name}".\n\nWhy is this even a thing?.`,
				autoCloseInSeconds: 15,
				relevance: 15,
				mood: "confused"
			});
		} else if (multiplier < 0.5) {
			multiplierWarningMessage.displayText({
				message: `Everyone will gain less recommendation\nwhen selecting "${typeInformation.name}.`,
				autoCloseInSeconds: 15,
				relevance: 15,
			});
		}
	}
});

const sessionTypeOptions: InputSelectValueType<SessionBlueprint["type"]>[] = [
	{value: "test", name: "Testing for bugs / feedback"},
	{value: "record", name: "Recording for trailer/screenshots"},
	{value: "fun", name: "Playing for fun"},
	{value: "stream", name: "Streaming maptesting/-making"},
]

const communicationOptions: InputSelectValueType<SessionBlueprint["preferences"]["communication"]>[] = [
	{value: "none", name: "No preference"},
	{value: "vc_encouraged", name: "Voicechat encouraged"},
	{value: "vc_required", name: "Voicechat required"},
	{value: "voice_encouraged", name: "Mic encouraged"},
	{value: "voice_required", name: "Mic required"},
]

const mapExperienceOptions: InputSelectValueType<SessionBlueprint["preferences"]["newPlayers"]>[] = [
	{value: "none", name: "No preference"},
	{value: "new", name: "New players only"},
	{value: "exp", name: "Returning players only"},
]
</script>

<style scoped>
.input-row:not(:last-child) {
	margin-bottom: 1em;
}

.players-count-row {
	display: flex;
	align-items: center;
}

.players-count-input {
	min-width: 0;
}

.players-count-input:first-child {
	margin-right: 1em;
}
</style>

<style scoped>
.input-row:not(:last-child) {
	margin-bottom: 1em;
}
</style>