<template>
	<div v-if="experienceResponse.isLoading">
		<loading-spinner/>
	</div>
	<div v-else-if="defaultBlueprint" class="experience-information">
		<h1 class="header">Edit {{data.experienceName}}</h1>
		<map-information-edit-section class="section" :session-blueprint="defaultBlueprint" v-model:image="data.newImage"/>
		<join-information-edit-section class="section" :session-blueprint="defaultBlueprint"/>
		<expectations-edit-section class="section" :session-blueprint="defaultBlueprint"/>
		<session-edit-section class="section" :session-blueprint="defaultBlueprint" :force-allow-pinging="true"/>
		<div class="button-holder">
			<normal-button :route-to="{name: 'Experience.Overview'}" class="option-button">Cancel</normal-button>
		</div>
		<div class="button-holder">
			<loading-button class="option-button" :loading="data.isUpdatingExperience" text="Update Experience" @click="updateExperience"/>
			<error-display @close="data.experienceUpdateError = ''">
				<p v-if="data.experienceUpdateError">{{data.experienceUpdateError}}</p>
			</error-display>
		</div>
	</div>
	<div v-else-if="experienceResponse.failedToLoad">
		<error-display :hide-close-icon="true">
			Failed to load experience.
		</error-display>
	</div>
	<div v-else>
		<error-display :hide-close-icon="true">
			<p>You are not able to edit this experience.</p>
		</error-display>
	</div>
</template>

<script setup lang="ts">
import ExperienceApiClient from '@/api-clients/experience-api-client';
import ErrorDisplay from '@/components/ErrorDisplay.vue';
import LoadingSpinner from '@/components/LoadingSpinner.vue';
import LoadingButton from '@/components/buttons/LoadingButton.vue';
import NormalButton from '@/components/buttons/NormalButton.vue';
import ExpectationsEditSection from '@/components/session/ExpectationsEditSection.vue';
import JoinInformationEditSection from '@/components/session/JoinInformationEditSection.vue';
import MapInformationEditSection from '@/components/session/MapInformationEditSection.vue';
import SessionEditSection from '@/components/session/SessionEditSection.vue';
import useLoadData from '@/composables/use-load-data';
import useProvidedItem from '@/composables/use-provided-item';
import { useValidateableForm } from '@/composables/use-validateable-form';
import { SessionBlueprint } from '$/types/session-blueprint-types';
import { ref, shallowReactive, watchEffect } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const experienceApiClient = useProvidedItem(ExperienceApiClient);
const form = useValidateableForm();
const route = useRoute();
const router = useRouter();

const data = shallowReactive({
	experienceUpdateError: "",
	experienceName: "",
	isUpdatingExperience: false,
	newImage: undefined as undefined|null|Blob,
});
const defaultBlueprint = ref<SessionBlueprint>();

const experienceResponse = useLoadData(() => experienceApiClient.getExperience(route.params.experienceId + ""), () => !!route.params.experienceId);
watchEffect(() => {
	if (experienceResponse.data?.ownsExperience) {
		defaultBlueprint.value = experienceResponse.data?.defaultBlueprint;
		data.experienceName = experienceResponse.data?.defaultBlueprint.name ?? "";
	}
});

async function updateExperience() {
	data.experienceUpdateError = "";
	const isValid = form.validateForm();
	if (!isValid || !experienceResponse.data || !defaultBlueprint.value) {
		return;
	}

	data.isUpdatingExperience = true;
	const result = await experienceApiClient.updateExperienceBlueprint({
		experienceId: experienceResponse.data.id,
		blueprint: defaultBlueprint.value,
		image: data.newImage,
	});
	data.isUpdatingExperience = false;
	if (!result.data) {
		data.experienceUpdateError = result.statusError?.statusText ?? (result.error + "");
		return;
	}

	router.push({name: "Experience.Overview"})
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

.header {
	flex-grow: 1;
	min-width: 90vw;
	text-align: center;
}
</style>