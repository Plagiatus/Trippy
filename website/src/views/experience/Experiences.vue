<template>
	<normal-button :route-to="{name: 'Experience.New'}">Create new experience</normal-button>
	<div v-if="experiencesResponse.isLoading">
		<loading-spinner/>
	</div>
	<div class="collection" v-else-if="experiencesResponse.data">
		<small-experience-display
			v-for="experience of experiencesResponse.data.experiences"
			:key="experience.id"
			:experience="experience"
		/>
	</div>
	<div v-else-if="experiencesResponse.failedToLoad">
		<error-display :hide-close-icon="true">
			Failed to load list of experiences.
		</error-display>
	</div>
</template>

<script setup lang="ts">
import ExperienceApiClient from '@/api-clients/experience-api-client';
import ErrorDisplay from '@/components/ErrorDisplay.vue';
import LoadingSpinner from '@/components/LoadingSpinner.vue';
import NormalButton from '@/components/buttons/NormalButton.vue';
import useLoadData from '@/composables/use-load-data';
import useProvidedItem from '@/composables/use-provided-item';
import SmallExperienceDisplay from './SmallExperienceDisplay.vue';

const experienceApiClient = useProvidedItem(ExperienceApiClient);
const experiencesResponse = useLoadData(() => experienceApiClient.getUsersExperiences());

</script>

<style scoped>
.collection {
	margin-top: 16px;
	display: flex;
	flex-wrap: wrap;
	gap: 16px;
}
</style>