<template>
	<normal-button :route-to="{name: 'Session.Create'}">Create new session</normal-button>
	<div v-if="sessionResponse.isLoading">
		<loading-spinner/>
	</div>
	<div class="collection" v-else-if="sessionResponse.data">
		<router-link
			v-for="session of hostedSessions"
			:key="session.id"
			:to="{name: 'Session.Overview', params: {sessionId: session.uniqueId}}"
		>
			<section class="session">
				<img v-if="session.imageId" :src="imageApiClient.getImageLink(session.imageId)" class="session-image"/>
				<div v-else class="session-image"></div>
				<div class="session-name-holder">
					<p class="session-name">{{session.name}} ({{session.id.toUpperCase()}})</p>
				</div>
			</section>
		</router-link>
	</div>
	<div v-else-if="sessionResponse.failedToLoad">
		<error-display :hide-close-icon="true">
			Failed to load list of sessions.
		</error-display>
	</div>
</template>

<script setup lang="ts">
import ImageApiClient from '@/api-clients/image-api-client';
import SessionApiClient from '@/api-clients/session-api-client';
import ErrorDisplay from '@/components/ErrorDisplay.vue';
import LoadingSpinner from '@/components/LoadingSpinner.vue';
import NormalButton from '@/components/buttons/NormalButton.vue';
import useLoadData from '@/composables/use-load-data';
import useProvidedItem from '@/composables/use-provided-item';
import { computed } from 'vue';

const sessionsApiClient = useProvidedItem(SessionApiClient);
const imageApiClient = useProvidedItem(ImageApiClient);
const sessionResponse = useLoadData(() => sessionsApiClient.getUsersSessions());
const hostedSessions = computed(() => sessionResponse.data?.sessions.filter(session => session.isHosting) ?? []);
</script>

<style scoped>
.collection {
	margin-top: 16px;
	display: flex;
	flex-wrap: wrap;
	gap: 16px;
}

.session {
	display: flex;
	flex-flow: column;
	width: 200px;
	border-radius: 8px;
	background-color: var(--background2);
	overflow: hidden;
	padding: 2px;
}

.session:hover {
	box-shadow: 2px 2px 5px 0 #00000030;
}

.session-image {
	border-top-right-radius: 6px;
	border-top-left-radius: 6px;
	width: 100%;
	height: 100px;
	object-fit: cover;
	background-color: var(--highlight);
}

.session-name-holder {
	width: 100%;
	flex-grow: 1;
	padding: 16px;
}

.session-name {
	text-align: center;
}
</style>