<template>
	<normal-button :route-to="{name: 'Experience.New'}">Create new experience</normal-button>
	<div v-if="experiencesResponse.isLoading">
		<loading-spinner/>
	</div>
	<div class="collection" v-else-if="experiencesResponse.data">
		<router-link
			v-for="experience of experiencesResponse.data.experiences"
			:key="experience.id"
			:to="{name: 'Experience.Overview', params: {experienceId: experience.id}}"
		>
			<section class="experience">
				<img v-if="experience.image" :src="experience.image" class="experience-image"/>
				<div v-else class="experience-image"></div>
				<div class="experience-name-holder">
					<p class="experience-name">{{experience.name}}</p>
				</div>
			</section>
		</router-link>
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

.experience {
	display: flex;
	flex-flow: column;
	width: 200px;
	border-radius: 8px;
	background-color: var(--background2);
	overflow: hidden;
	padding: 2px;
}

.experience:hover {
	box-shadow: 2px 2px 5px 0 #00000030;
}

.experience-image {
	border-top-right-radius: 6px;
	border-top-left-radius: 6px;
	width: 100%;
	height: 100px;
	object-fit: cover;
	background-color: var(--highlight);
}

.experience-name-holder {
	width: 100%;
	flex-grow: 1;
	padding: 16px;
}

.experience-name {
	text-align: center;
}
</style>