<template>
	<div v-if="sessionResponse.isLoading">
		<loading-spinner/>
	</div>
	<div v-else-if="sessionResponse.data" class="overview-page">
		<div class="session-details">
			<session-details :session="sessionResponse.data" />
			<session-player-history :session="sessionResponse.data" class="player-history"/>
		</div>
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
import SessionApiClient from '@/api-clients/session-api-client';
import SessionDetails from '@/components/session/SessionDetails.vue';
import SessionPlayerHistory from '@/components/session/SessionPlayerHistory.vue';
import ErrorDisplay from '@/components/ErrorDisplay.vue';
import LoadingSpinner from '@/components/LoadingSpinner.vue';
import NormalButton from '@/components/buttons/NormalButton.vue';
import useLoadData from '@/composables/use-load-data';
import useDependency from '@/composables/use-dependency';
import useRandomTrippyMessage from '@/composables/use-random-trippy-message';
import { useRoute } from 'vue-router';

const sessionApiClient = useDependency(SessionApiClient);
const route = useRoute();
const sessionResponse = useLoadData(() => sessionApiClient.getSessionInformation(route.params.sessionId + ""), () => !!route.params.sessionId);


useRandomTrippyMessage((add) => {
	if (!sessionResponse.data) {
		add({message: "Can't find the session?\n\nMaybe try contacting a moderator?"});
		return;
	}

	if (sessionResponse.data.state === "ended") {
		add({message: "I remember this session. It was pretty good."});
		add({message: `I remember it as if it was yesterday...\n\nMe and ${sessionResponse.data.blueprint.name}\nwe were the perfect pair...\n\nBut ${sessionResponse.data.blueprint.name} left me...`, mood: "angry", weight: 0.05});
	
		if (sessionResponse.data.hasJoined) {
			add({message: "You remember how good this session was?"});
		}
		if (sessionResponse.data.isHost) {
			add({message: "You should do more sessions like this one."});
		}
	}

	if (sessionResponse.data.state === "running") {
		add({message: "This session is so much fun!", mood: "suprised"});
	}

	if (!sessionResponse.data.hasJoined && !sessionResponse.data.isHost) {
		add({message: "Why are you looking at this session?\n\nIf you want to make your own session then\ngo to sessions and press \"Create new session\".", mood: "confused", weight: 5});
	}
});
</script>

<style scoped>
.overview-page {
	display: flex;
	flex-flow: column;
	gap: 32px;
}

.session-details {
	display: flex;
	gap: 32px;
	align-items: flex-start;
}

.player-history {
	flex-grow: 1;
}

.options {
	display: flex;
	flex-flow: column;
	gap: 16px;
}
</style>