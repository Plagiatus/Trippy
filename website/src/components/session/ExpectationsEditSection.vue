<template>
	<content-box header="Expectations">
		<input-select v-model="sessionBlueprint.type" :values="sessionTypeOptions" name="Need help with" class="input-row" required/>
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
import { PartialSessionBlueprint, SessionBlueprint } from '@/types/session-blueprint-types';
import ContentBox from '../ContentBox.vue';

defineProps<{
	sessionBlueprint: PartialSessionBlueprint;
}>()

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