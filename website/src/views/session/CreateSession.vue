<template>
	<loading-spinner v-if="creatingSessionForExperienceId && !data.hasLoadedBlueprint"/>
	<div class="session-information" v-else-if="!data.didMakeSession">
		<h1 v-if="creatingSessionForExperienceId" class="header">Create new session for {{data.experienceName}}</h1>
		<h1 v-else class="header">Create new session</h1>
		<map-information-edit-section class="section" :session-blueprint="sessionBlueprint"/>
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
	<div v-else class="session-created">
		<p>Your session has been created!</p>
		<p>Go back to <a :href="config.discordInviteLink" target="_blank" rel="noopener noreferrer">Discord</a>.</p>
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
import { useRoute } from 'vue-router';
import ExperienceApiClient from '@/api-clients/experience-api-client';
import LoadingSpinner from '@/components/LoadingSpinner.vue';
import NormalButton from '@/components/buttons/NormalButton.vue';

const data = shallowReactive({
	sessionCreationError: "",
	experienceName: "",
	didMakeSession: false,
	isCreatingSession: false,
	hasLoadedBlueprint: false,
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

const creatingSessionForExperienceId = computed(() => {
	return route.params.experienceId;
});

watchEffect(async (cleanUp) => {
	if (!creatingSessionForExperienceId.value) {
		data.hasLoadedBlueprint = true;
		return;
	}

	let useResponse = true;
	cleanUp(() => useResponse = false);

	data.hasLoadedBlueprint = false;
	const experienceResponse = await experienceApiClient.getExperience(creatingSessionForExperienceId.value + "");
	if (!useResponse) {
		return;
	}

	if (experienceResponse.data) {
		sessionBlueprint.value = experienceResponse.data.experience.defaultBlueprint;
		data.experienceName = experienceResponse.data.experience.defaultBlueprint.name;
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
		experienceId: creatingSessionForExperienceId.value + "",
	});
	data.isCreatingSession = false;
	if (!result.data) {
		data.sessionCreationError = result.statusError?.statusText ?? (result.error + "");
		return;
	}
	data.didMakeSession = true;
}
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