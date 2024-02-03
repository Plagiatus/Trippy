<template>
	<normal-button :route-to="{name: 'Session.Create'}">Create new session</normal-button>
	<div v-if="sessionResponse.isLoading">
		<loading-spinner/>
	</div>
	<div v-else-if="sessionResponse.data">
		<template v-if="sessionResponse.data.hostingSession">
			<h1 class="section-header">Current session</h1>
			<small-session-display :session="sessionResponse.data.hostingSession"/>
		</template>
		<template v-if="sessionResponse.data.inSession">
			<h1 class="section-header">Current session</h1>
			<small-session-display :session="sessionResponse.data.inSession"/>
		</template>
		<template v-if="sessionResponse.data.latestHostedSessions.length > 0">
			<h1 class="section-header">Latest hosted session{{sessionResponse.data.latestHostedSessions.length === 1 ? "" : "s"}}</h1>
			<div class="collection">
				<small-session-display
					v-for="session of sessionResponse.data.latestHostedSessions"
					:session="session"
				/>
			</div>
		</template>
		<template v-if="sessionResponse.data.latestJoinedSessions.length > 0">
			<h1 class="section-header">Latest joined session{{sessionResponse.data.latestJoinedSessions.length === 1 ? "" : "s"}}</h1>
			<div class="collection">
				<small-session-display
					v-for="session of sessionResponse.data.latestJoinedSessions"
					:session="session"
				/>
			</div>
		</template>
	</div>
	<div v-else-if="sessionResponse.failedToLoad">
		<error-display :hide-close-icon="true">
			Failed to load list of sessions.
		</error-display>
	</div>
</template>

<script setup lang="ts">
import SessionApiClient from '@/api-clients/session-api-client';
import ErrorDisplay from '@/components/ErrorDisplay.vue';
import LoadingSpinner from '@/components/LoadingSpinner.vue';
import NormalButton from '@/components/buttons/NormalButton.vue';
import useLoadData from '@/composables/use-load-data';
import useProvidedItem from '@/composables/use-provided-item';
import SmallSessionDisplay from './SmallSessionDisplay.vue';

const sessionsApiClient = useProvidedItem(SessionApiClient);
const sessionResponse = useLoadData(() => sessionsApiClient.getUsersSessions());
</script>

<style scoped>
.collection {
	margin-top: 16px;
	display: flex;
	flex-wrap: wrap;
	gap: 16px;
}

.section-header {
	margin-top: 32px;
}
</style>