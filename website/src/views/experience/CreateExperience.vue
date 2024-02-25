<template>
	<div class="experience-information">
		<h1 class="header">Create new experience</h1>
		<map-information-edit-section class="section" :session-blueprint="sessionBlueprint" v-model:image="data.image"/>
		<join-information-edit-section class="section" :session-blueprint="sessionBlueprint"/>
		<expectations-edit-section class="section" :session-blueprint="sessionBlueprint"/>
		<session-edit-section class="section" :session-blueprint="sessionBlueprint" :force-allow-pinging="true"/>
		<div class="create-experience-button-holder">
			<loading-button class="create-experience-button" :loading="data.isCreatingExperience" text="Create Experience" @click="createExperience"/>
			<error-display @close="data.experienceCreationError = ''">
				<p v-if="data.experienceCreationError">{{data.experienceCreationError}}</p>
			</error-display>
		</div>
	</div>
</template>

<script setup lang="ts">
import { PartialSessionBlueprint, SessionBlueprint } from '@/types/session-blueprint-types';
import { ref, shallowReactive } from 'vue';
import MapInformationEditSection from '@/components/session/MapInformationEditSection.vue';
import JoinInformationEditSection from '@/components/session/JoinInformationEditSection.vue';
import ExpectationsEditSection from '@/components/session/ExpectationsEditSection.vue';
import SessionEditSection from '@/components/session/SessionEditSection.vue';
import { useValidateableForm } from '@/composables/use-validateable-form';
import useProvidedItem from '@/composables/use-provided-item';
import ErrorDisplay from '@/components/ErrorDisplay.vue';
import LoadingButton from '@/components/buttons/LoadingButton.vue';
import ExperienceApiClient from '@/api-clients/experience-api-client';
import { useRouter } from 'vue-router';
import useRandomTrippyMessage from '@/composables/use-random-trippy-message';

const data = shallowReactive({
	experienceCreationError: "",
	isCreatingExperience: false,
	image: undefined as undefined|Blob|null,
});

const sessionBlueprint = ref<PartialSessionBlueprint>({
	preferences: {players: {}},
	voiceChannels: [],
});

const experienceApiClient = useProvidedItem(ExperienceApiClient);
const form = useValidateableForm();
const router = useRouter();

async function createExperience() {
	data.experienceCreationError = "";
	const isValid = form.validateForm();
	if (!isValid) {
		return;
	}

	data.isCreatingExperience = true;
	const result = await experienceApiClient.createExperience({
		blueprint: sessionBlueprint.value as SessionBlueprint,
		image: data.image ?? undefined,
	});
	data.isCreatingExperience = false;
	if (!result.data) {
		data.experienceCreationError = result.statusError?.statusText ?? (result.error + "");
		return;
	}

	router.push({
		name: "Experience.Overview",
		params: {
			experienceId: result.data.experienceId,
		}
	})
}

useRandomTrippyMessage((add) => {
	add({message: "This sounds like a fun experience!", mood: "suprised"});
	add({message: "Making this experience is taking you a long time.", mood: "tired", weight: 0.05});

	if (sessionBlueprint.value.description) {
		add({message: "Are you sure that description is good enough?\n\nDid you remember to write about how cool it is?", weight: 0.333});
		add({message: "Are you sure that description is good enough?\n\nYou could write more words. Words are good.", weight: 0.333});
		add({message: "Are you sure that description is good enough?\n\nDid you describe the lore?", weight: 0.333});
	}

	if (sessionBlueprint.value.name) {
		add({message: `${sessionBlueprint.value.name} is a pretty good name.`, mood: "suprised"});
	}

	if (sessionBlueprint.value.edition === "java") {
		add({message: "You got Java Edition? Me too!", mood: "suprised"});
	}
	if (sessionBlueprint.value.edition === "bedrock") {
		add({message: "You got Bedrock Edition? Me too!", mood: "suprised"});
	}

	if (sessionBlueprint.value.voiceChannels.length > 2) {
		add({message: "That is a lot of voice channels!", mood: "suprised"});
	}

	if (sessionBlueprint.value.rpLink) {
		add({message: "That resource pack looks good!", mood: "suprised"});
	}

	if (sessionBlueprint.value.preferences.timeEstimate ?? 0 > 2) {
		add({message: "Sounds like it takes a long time\nto get through this experience.", mood: "normal"});
	}
}, {minimumSecondsDelay: 30, maximumSecondsDelay: 240, keepOnSendingMessages: true, autoCloseInSeconds: 10});
</script>

<style scoped>
.experience-information {
	display: flex;
	justify-content: space-between;
	flex-wrap: wrap;
	padding-bottom: 3em;
	gap: 1em;
}

.section {
	min-width: 450px;
	flex-basis: 0;
	flex-grow: 1;
}

.section>* {
	width: 100%;
}

.create-experience-button {
	margin-top: 0.5em;
	font-size: 2.5em;
}

.create-experience-button-holder {
	display: flex;
	flex-direction: column;
	align-items: center;
	flex-grow: 10000;
	align-self: center;
	min-width: 50vw;
	order: 6;
	gap: 1em;
}

.header {
	flex-grow: 1;
	min-width: 90vw;
	text-align: center;
}
</style>