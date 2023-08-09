<template>
	<div class="sessions-view">
		<div class="collection">
			<big-icon-button icon="/icons/add.svg" title="Set up a new session" :routeTo="{ name: 'Sessions.Setup' }"/>
			<big-icon-button icon="/icons/user-feedback.svg" title="View feedback" :routeTo="{ name: 'Sessions.Feedback' }"/>
		</div>
		<transition-size>
			<div class="collection" v-if="!data.userSessions">
				<loading-spinner/>
			</div>
			<div class="collection" v-else>
				<big-icon-button
					v-for="session of hostedSessions"
					:key="session.id"
					icon="/icons/add.svg"
					:title="`Edit session &quot;${session.name}&quot;`"
					:routeTo="{ name: 'Sessions.Overview', params: {sessionId: session.id} }"
				/>
			</div>
		</transition-size>
	</div>
</template>

<script setup lang="ts">
import SessionsApiClient from '@/api-clients/sessions-api-client';
import AuthenticationHandler from '@/authentication-handler';
import LoadingSpinner from '@/components/LoadingSpinner.vue';
import TransitionSize from '@/components/TransitionSize.vue';
import BigIconButton from '@/components/buttons/BigIconButton.vue';
import useProvidedItem from '@/composables/use-provided-item';
import { UserSessionsListDto } from '@/types/dto-types';
import { computed, onMounted, shallowReactive } from 'vue';

const data = shallowReactive({
	userSessions: null as null|UserSessionsListDto["sessions"],
});

const authenticationHandler = useProvidedItem(AuthenticationHandler);
const sessionsApiClient = useProvidedItem(SessionsApiClient);

const hostedSessions = computed(() => {
	return data.userSessions?.filter(x => x.isHosting) ?? [];
});

onMounted(async () => {
	if (!authenticationHandler.isLoggedIn()) {
		data.userSessions = [];
		return;
	}

	const response = await sessionsApiClient.getUsersSessions();
	data.userSessions = response.data?.sessions ?? [];
});

</script>

<style scoped>
.sessions-view {
	display: flex;
	flex-direction: column;
}

.collection {
	display: flex;
	flex-direction: row;
	flex-wrap: wrap;
	justify-content: space-evenly;
}

.loading-holder {
	width: 200px;
}

@media screen and (max-width: 740px) {
	#sessions-wrapper {
		flex-direction: column;
	}
	.sessions-link > span {
		font-size: 1.5em;
	}
}
</style>