<template>
	<loading-spinner v-if="creatingSessionForExperienceId && !data.hasLoadedBlueprint"/>
	<div class="session-information" v-else>
		<h1 v-if="creatingSessionForExperienceId" class="header">Create new session for {{data.experienceName}}</h1>
		<h1 v-else class="header">Create new session</h1>
		<map-information-edit-section class="section" :session-blueprint="sessionBlueprint" v-model:image="data.image"/>
		<join-information-edit-section class="section" :session-blueprint="sessionBlueprint"/>
		<expectations-edit-section class="section" :session-blueprint="sessionBlueprint"/>
		<session-edit-section class="section" :session-blueprint="sessionBlueprint"/>
		<div class="button-holder" v-if="creatingSessionForExperienceId">
			<normal-button :route-to="{name: 'Experience.Overview'}" class="option-button">Cancel</normal-button>
		</div>
		<div class="button-holder">
			<loading-button class="option-button" :loading="data.isCreatingSession" text="Create Session" @click="createSession"/>
			<error-display @close="data.sessionCreationError = ''">
				<p v-if="data.sessionCreationError">{{data.sessionCreationError}}</p>
			</error-display>
		</div>
	</div>
</template>

<script setup lang="ts">
import { PartialSessionBlueprint, SessionBlueprint } from '@/types/session-blueprint-types';
import { computed, ref, shallowReactive, watchEffect } from 'vue';
import MapInformationEditSection from '@/components/session/MapInformationEditSection.vue';
import JoinInformationEditSection from '@/components/session/JoinInformationEditSection.vue';
import ExpectationsEditSection from '@/components/session/ExpectationsEditSection.vue';
import SessionEditSection from '@/components/session/SessionEditSection.vue';
import { useValidateableForm } from '@/composables/use-validateable-form';
import useProvidedItem from '@/composables/use-provided-item';
import SessionApiClient from '@/api-clients/session-api-client';
import ErrorDisplay from '@/components/ErrorDisplay.vue';
import Config from '@/config';
import LoadingButton from '@/components/buttons/LoadingButton.vue';
import { useRoute, useRouter } from 'vue-router';
import ExperienceApiClient from '@/api-clients/experience-api-client';
import LoadingSpinner from '@/components/LoadingSpinner.vue';
import NormalButton from '@/components/buttons/NormalButton.vue';
import useRandomTrippyMessage from '@/composables/use-random-trippy-message';

const data = shallowReactive({
	sessionCreationError: "",
	experienceName: "",
	isCreatingSession: false,
	hasLoadedBlueprint: false,
	image: undefined as undefined|Blob|null,
});

const sessionBlueprint = ref<PartialSessionBlueprint>({
	preferences: {players: {}},
	voiceChannels: [],
});

const config = useProvidedItem(Config);
const sessionApiClient = useProvidedItem(SessionApiClient);
const experienceApiClient = useProvidedItem(ExperienceApiClient);
const form = useValidateableForm();
const route = useRoute();
const router = useRouter();

const creatingSessionForExperienceId = computed(() => {
	return typeof route.params.experienceId === "string" ? route.params.experienceId : undefined;
});

watchEffect(async (cleanUp) => {
	if (!creatingSessionForExperienceId.value) {
		data.hasLoadedBlueprint = true;
		return;
	}

	let useResponse = true;
	cleanUp(() => useResponse = false);

	data.hasLoadedBlueprint = false;
	const experienceResponse = await experienceApiClient.getExperience(creatingSessionForExperienceId.value);
	if (!useResponse) {
		return;
	}

	if (experienceResponse.data && experienceResponse.data.ownsExperience) {
		sessionBlueprint.value = experienceResponse.data.defaultBlueprint;
		data.experienceName = experienceResponse.data.defaultBlueprint.name;
	}
	data.hasLoadedBlueprint = true;
});

async function createSession() {
	data.sessionCreationError = "";
	const isValid = form.validateForm();
	if (!isValid) {
		return;
	}

	data.isCreatingSession = true;
	const result = await sessionApiClient.createSession({
		blueprint: sessionBlueprint.value as SessionBlueprint,
		experienceId: creatingSessionForExperienceId.value,
		image: data.image ?? undefined,
	});
	data.isCreatingSession = false;
	if (!result.data) {
		data.sessionCreationError = result.statusError?.statusText ?? (result.error + "");
		return;
	}
	router.push({name: "Session.Overview", params: {sessionId: result.data.uniqueSessionId}})
}

useRandomTrippyMessage((add) => {
	add({message: "Sounds like this is going to be a fun session!", mood: "suprised"});
	add({message: "Making this session is taking you a long time.", mood: "tired", weight: 0.05});

	if (sessionBlueprint.value.description) {
		add({message: "Are you sure that description is good enough?\n\nDid you remember to write about how cool it is?", weight: 0.333});
		add({message: "Are you sure that description is good enough?\n\nYou could write more words. Words are good.", weight: 0.333});
		add({message: "Are you sure that description is good enough?\n\nDid you write about the new features?", weight: 0.333});
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
		add({message: "Sounds like this session will take a long time.", mood: "normal"});
	}
}, {minimumSecondsDelay: 30, maximumSecondsDelay: 240, keepOnSendingMessages: true, autoCloseInSeconds: 10});
</script>

<style scoped>
.session-information {
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

.option-button {
	margin-top: 0.5em;
	font-size: 2.5em;
}

.button-holder {
	display: flex;
	flex-direction: column;
	align-items: center;
	flex-grow: 10000;
	align-self: center;
	min-width: 40vw;
	order: 6;
	gap: 1em;
}

@media screen and (min-width: 1880px) {
	.template-section {
		order: 5;
	}
}

.session-created {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	width: 100%;
	height: 100%;
}

.header {
	flex-grow: 1;
	min-width: 90vw;
	text-align: center;
}
</style>