<template>
	<div v-if="experience.isLoading">
		<loading-spinner/>
	</div>
	<div v-else-if="experience.data" class="overview-page">
		<content-box class="experience-overview">
			<img v-if="experience.data.experience.defaultBlueprint.imageId" :src="imageApiClient.getImageLink(experience.data.experience.defaultBlueprint.imageId)" class="experience-image"/>
			<div v-else class="experience-image"></div>
			<h1 class="map-name">{{experience.data.experience.defaultBlueprint.name}}</h1>
			<div class="details">
				<span class="detail-name">Edition:</span><span class="detail-value edition-value">{{experience.data.experience.defaultBlueprint.edition}}</span>
				<template v-if="experience.data.experience.defaultBlueprint.edition === 'java'">
					<span class="detail-name">Version:</span>
					<span class="detail-value">{{experience.data.experience.defaultBlueprint.version}}</span>
				</template>
				<span class="detail-name">Players:</span><span class="detail-value">{{playerCountString}}</span>
			</div>
		</content-box>
		<div class="options">
			<normal-button :route-to="{name: 'Experience.Edit'}">Edit experience</normal-button>
			<normal-button :route-to="{name: 'Session.Create', params: {experienceId: experience.data.experience.id}}">Create session for experience</normal-button>
		</div>
	</div>
	<div v-else-if="experience.failedToLoad">
		<error-display :hide-close-icon="true">
			Failed to load experience.
		</error-display>
	</div>
</template>

<script setup lang="ts">
import ExperienceApiClient from '@/api-clients/experience-api-client';
import ImageApiClient from '@/api-clients/image-api-client';
import ContentBox from '@/components/ContentBox.vue';
import ErrorDisplay from '@/components/ErrorDisplay.vue';
import LoadingSpinner from '@/components/LoadingSpinner.vue';
import NormalButton from '@/components/buttons/NormalButton.vue';
import useLoadData from '@/composables/use-load-data';
import useProvidedItem from '@/composables/use-provided-item';
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const experienceApiClient = useProvidedItem(ExperienceApiClient);
const imageApiClient = useProvidedItem(ImageApiClient);
const route = useRoute();
const experience = useLoadData(() => experienceApiClient.getExperience(route.params.experienceId + ""), () => !!route.params.experienceId);

const playerCountString = computed(() => {
	const minPlayers = experience.data?.experience.defaultBlueprint.preferences.players.min;
	const maxPlayers = experience.data?.experience.defaultBlueprint.preferences.players.max;
	
	if (minPlayers === undefined && maxPlayers === undefined) {
		return "Unlimited"
	}
	if (minPlayers !== undefined && maxPlayers === undefined) {
		return minPlayers + "+";
	}
	if (minPlayers === undefined && maxPlayers !== undefined) {
		return "Max " + maxPlayers;
	}
	return minPlayers + "-" + maxPlayers;
});
</script>

<style scoped>
.overview-page {
	display: flex;
	gap: 32px;
}

.experience-overview {
	display: flex;
	flex-flow: column;
	align-items: flex-start;
	width: 300px;
}

.map-name {
	text-align: center;
	width: 100%;
	padding: 16px 20px;
}

.details {
	display: grid;
	grid-template-columns: auto auto;
	gap: 8px;
}

.detail-name {
	font-weight: bold;
}

.edition-value {
	text-transform: capitalize;
}

.experience-image {
	border-radius: 6px;
	width: 100%;
	height: 200px;
	object-fit: cover;
	background-color: var(--highlight);
}

.options {
	display: flex;
	flex-flow: column;
	gap: 16px;
}
</style>