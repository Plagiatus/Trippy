<template>
	<div v-if="sessionResponse.isLoading">
		<loading-spinner/>
	</div>
	<div v-else-if="sessionResponse.data" class="overview-page">
		<content-box class="session-overview">
			<img v-if="sessionResponse.data.blueprint.imageId" :src="imageApiClient.getImageLink(sessionResponse.data.blueprint.imageId)" class="session-image"/>
			<div v-else class="session-image"></div>
			<h1 class="map-name">{{sessionResponse.data.blueprint.name}}</h1>
			<h2 class="session-id">({{sessionResponse.data.id}})</h2>
			<div class="details">
				<span class="detail-name">Edition:</span><span class="detail-value edition-value">{{sessionResponse.data.blueprint.edition}}</span>
				<template v-if="sessionResponse.data.blueprint.edition === 'java'">
					<span class="detail-name">Version:</span>
					<span class="detail-value">{{sessionResponse.data.blueprint.version}}</span>
				</template>
				<span class="detail-name">Players:</span><span class="detail-value">{{playerCountString}}</span>
			</div>
		</content-box>
		<content-box header="Users" class="users-section">
			<div
				v-for="user of sessionResponse.data.users"
				:key="user.id"
				class="user-row"
			>
				<img v-if="user.avatar" :src="user.avatar" class="user-image"/>
				<div v-else class="user-image"></div>
				{{user.name}}
			</div>
		</content-box>
		<div class="options">
			<normal-button :route-to="{name: 'Session.Edit'}">Edit session</normal-button>
		</div>
	</div>
	<div v-else-if="sessionResponse.failedToLoad">
		<error-display :hide-close-icon="true">
			Failed to load session.
		</error-display>
	</div>
</template>

<script setup lang="ts">
import ImageApiClient from '@/api-clients/image-api-client';
import SessionApiClient from '@/api-clients/session-api-client';
import ContentBox from '@/components/ContentBox.vue';
import ErrorDisplay from '@/components/ErrorDisplay.vue';
import LoadingSpinner from '@/components/LoadingSpinner.vue';
import NormalButton from '@/components/buttons/NormalButton.vue';
import useLoadData from '@/composables/use-load-data';
import useProvidedItem from '@/composables/use-provided-item';
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const sessionApiClient = useProvidedItem(SessionApiClient);
const imageApiClient = useProvidedItem(ImageApiClient);
const route = useRoute();
const sessionResponse = useLoadData(() => sessionApiClient.getSessionInformation(route.params.sessionId + ""), () => !!route.params.sessionId);

const playerCountString = computed(() => {
	const minPlayers = sessionResponse.data?.blueprint.preferences.players.min;
	const maxPlayers = sessionResponse.data?.blueprint.preferences.players.max;
	
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

.session-overview {
	display: flex;
	flex-flow: column;
	align-items: flex-start;
	width: 300px;
}

.map-name {
	text-align: center;
	width: 100%;
	padding: 16px 20px;
	padding-bottom: 0;
}

.session-id {
	text-align: center;
	width: 100%;
	padding: 16px 20px;
	padding-top: 0;
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

.session-image {
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

.users-section {
	min-width: 300px;
}

.user-row {
	display: flex;
	align-items: center;
	margin-bottom: 0.5rem;
	background-color: var(--background);
	padding: 0.5rem 1rem;
	border-radius: 1rem;
}

.user-image {
	width: 2rem;
	height: 2rem;
	border-radius: 100%;
	margin-right: 0.5rem;
}
</style>