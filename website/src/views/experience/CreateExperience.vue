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