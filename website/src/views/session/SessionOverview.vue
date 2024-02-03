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
				<span class="detail-name">Host:</span><discord-user class="detail-value" :user="sessionResponse.data.host"/>
				<span class="detail-name">Edition:</span><span class="detail-value edition-value">{{sessionResponse.data.blueprint.edition}}</span>
				<template v-if="sessionResponse.data.blueprint.edition === 'java'">
					<span class="detail-name">Version:</span>
					<span class="detail-value">{{sessionResponse.data.blueprint.version}}</span>
				</template>
				<span class="detail-name">Players:</span><span class="detail-value">{{playerCountString}}</span>
				<template v-if="sessionResponse.data.experience">
					<span class="detail-name">Experience:</span>
					<router-link
						:to="{
							name: 'Experience.Overview',
							params: {
								experienceId: sessionResponse.data.experience.id,
							}
						}"
						class="detail-value experience-link"
					>
						{{sessionResponse.data.experience.name}}
					</router-link>
				</template>
				<template v-if="sessionResponse.data.startedAt !== null">
					<span class="detail-name">Started at:</span><span class="detail-value">{{timeHelper.formatDateTime(new Date(sessionResponse.data.startedAt))}}</span>
				</template>
			</div>
		</content-box>
		<content-box v-if="sessionResponse.data.state === 'running'" header="Users" class="users-section">
			<discord-user
				v-for="user of sessionResponse.data.users"
				:key="user.id"
				:user="user"
				class="joined-user"
			/>
		</content-box>
		<div class="options">
			<normal-button v-if="sessionResponse.data.isHost && sessionResponse.data.state === 'running'" :route-to="{name: 'Session.Edit'}">Edit session</normal-button>
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
import DiscordUser from '@/components/DiscordUser.vue';
import ErrorDisplay from '@/components/ErrorDisplay.vue';
import LoadingSpinner from '@/components/LoadingSpinner.vue';
import NormalButton from '@/components/buttons/NormalButton.vue';
import useLoadData from '@/composables/use-load-data';
import useProvidedItem from '@/composables/use-provided-item';
import TimeHelper from '@/time-helper';
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const sessionApiClient = useProvidedItem(SessionApiClient);
const imageApiClient = useProvidedItem(ImageApiClient);
const timeHelper = useProvidedItem(TimeHelper);
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
	align-items: center;
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

.joined-user {
	margin-bottom: 0.5rem;
	background-color: var(--background);
	padding: 0.5rem 1rem;
	border-radius: 1rem;
}

.experience-link {
	color: var(--highlight);
	text-decoration: underline;
}
</style>