<template>
	<div v-if="experienceResponse.isLoading">
		<loading-spinner/>
	</div>
	<div v-else-if="experienceResponse.data" class="overview-page">
		<experience-details :experience="experienceResponse.data" />
		<div class="options">
			<normal-button v-if="experienceResponse.data.ownsExperience" :route-to="{name: 'Experience.Edit'}">Edit experience</normal-button>
			<normal-button v-if="experienceResponse.data.ownsExperience" :route-to="{name: 'Session.Create', params: {experienceId: experienceResponse.data.id}}">Create session for experience</normal-button>
			<loading-button v-if="experienceResponse.data.ownsExperience" :loading="data.isDeleting" color="danger" @click="startDeletingExperience">Delete experience</loading-button>
		</div>
	</div>
	<div v-else-if="experienceResponse.failedToLoad">
		<error-display :hide-close-icon="true">
			Failed to load experience.
		</error-display>
	</div>
</template>

<script setup lang="ts">
import ExperienceApiClient from '@/api-clients/experience-api-client';
import ExperienceDetails from '@/components/ExperienceDetails.vue';
import ErrorDisplay from '@/components/ErrorDisplay.vue';
import LoadingSpinner from '@/components/LoadingSpinner.vue';
import LoadingButton from '@/components/buttons/LoadingButton.vue';
import NormalButton from '@/components/buttons/NormalButton.vue';
import PopupContainer from '@/popup-container';
import useLoadData from '@/composables/use-load-data';
import useDependency from '@/composables/use-dependency';
import useRandomTrippyMessage from '@/composables/use-random-trippy-message';
import { shallowReactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const experienceApiClient = useDependency(ExperienceApiClient);
const route = useRoute();
const router = useRouter();
const experienceResponse = useLoadData(() => experienceApiClient.getExperience(route.params.experienceId + ""), () => !!route.params.experienceId);

const popupService = useDependency(PopupContainer);

const data = shallowReactive({
	isDeleting: false,
});

async function startDeletingExperience() {
	if (!experienceResponse.data) {
		return;
	}

	const result = await popupService.displayYesNoDialog({
		header: "Delete experience",
		body: `Are you sure you want to delete ${experienceResponse.data.defaultBlueprint.name}?`,
	});
	if (!result) {
		return;
	}

	data.isDeleting = true;
	try {
		await experienceApiClient.deleteExperience(experienceResponse.data.id);
		router.push({name: "Experience"});
	} finally {
		data.isDeleting = false;
	}
}

useRandomTrippyMessage((add) => {
	if (!experienceResponse.data) {
		add({message: "Can't find the experience?\n\nMaybe try contacting a moderator?"});
		return;
	}

	add({message: "This experience sounds like fun.", mood: "suprised", weight: 2});
	add({message: "You don't have something better\nto do other than looking at this page?", mood: "tired", weight: 0.2});
	add({message: `${experienceResponse.data.defaultBlueprint.name} is a pretty good name for an experience.`, mood: "normal"});

	if (experienceResponse.data.ownsExperience) {
		add({mood: "normal", message: "Do you want to start a new\nsession for this experience?\n\nJust press the\n\"Create session for experience\" button."});
		add({mood: "suprised", message: "Can't wait for the next time you host a session for this!"});
		add({mood: "tired", message: "You gonna start a session soon?", weight: 0.2});
	} else {
		add({message: `You ever thought about why it's called ${experienceResponse.data.defaultBlueprint.name}?`, mood: "confused"});
		add({message: `Have you tried this experience?\nWas it fun?`, mood: "normal"});
	}
});
</script>

<style scoped>
.overview-page {
	display: flex;
	gap: 32px;
}

.options {
	display: flex;
	flex-flow: column;
	gap: 16px;
}

.delete-experience-name {
	color: var(--highlight);
}
</style>