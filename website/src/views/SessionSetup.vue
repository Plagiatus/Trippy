<template>
	<div class="session-information" v-if="!data.didMakeSession">
		<template-edit-section class="section template-section" v-model:session-blueprint="sessionBlueprint" :session-form="form"/>
		<map-information-edit-section class="section" :session-blueprint="sessionBlueprint"/>
		<join-information-edit-section class="section" :session-blueprint="sessionBlueprint"/>
		<expectations-edit-section class="section" :session-blueprint="sessionBlueprint"/>
		<session-edit-section class="section" :session-blueprint="sessionBlueprint"/>
		<div class="create-session-button-holder">
			<loading-button class="create-session-button" :loading="data.isCreatingSession" text="Create Session" @click="createSession"/>
			<error-display @close="data.sessionCreationError = ''">
				<p v-if="data.sessionCreationError">{{data.sessionCreationError}}</p>
			</error-display>
		</div>
	</div>
	<div v-else class="session-created">
		<p>Your session has been created!</p>
		<p>Go back to <a :href="config.discordInviteLink" target="_blank" rel="noopener noreferrer">Discord</a>.</p>
	</div>
</template>

<script setup lang="ts">
import { PartialSessionBlueprint, SessionBlueprint } from '@/types/session-blueprint-types';
import { ref, shallowReactive } from 'vue';
import MapInformationEditSection from '@/components/session/MapInformationEditSection.vue';
import JoinInformationEditSection from '@/components/session/JoinInformationEditSection.vue';
import ExpectationsEditSection from '@/components/session/ExpectationsEditSection.vue';
import SessionEditSection from '@/components/session/SessionEditSection.vue';
import { useValidateableForm } from '@/composables/use-validateable-form';
import TemplateEditSection from '@/components/session/TemplateEditSection.vue';
import useProvidedItem from '@/composables/use-provided-item';
import SessionsApiClient from '@/api-clients/sessions-api-client';
import ErrorDisplay from '@/components/ErrorDisplay.vue';
import Config from '@/config';
import LoadingButton from '@/components/buttons/LoadingButton.vue';

const data = shallowReactive({
	sessionCreationError: "",
	didMakeSession: false,
	isCreatingSession: false,
});

const sessionBlueprint = ref<PartialSessionBlueprint>({
	preferences: {players: {}},
	voiceChannels: [],
});

const config = useProvidedItem(Config);
const sessionsApiClient = useProvidedItem(SessionsApiClient);
const form = useValidateableForm();

async function createSession() {
	data.sessionCreationError = "";
	const isValid = form.validateForm();
	if (!isValid) {
		return;
	}

	data.isCreatingSession = true;
	const result = await sessionsApiClient.createSession(sessionBlueprint.value as SessionBlueprint);
	data.isCreatingSession = false;
	if (!result.data) {
		data.sessionCreationError = result.statusError?.statusText ?? (result.error + "");
		return;
	}
	data.didMakeSession = true;
}
</script>

<style scoped>
.session-information {
	display: flex;
	justify-content: space-between;
	flex-wrap: wrap;
	padding-bottom: 3em;
	gap: 1em;
}

.section {
	min-width: 450px;
	flex-basis: 0;
	flex-grow: 1;
}

.section>* {
	width: 100%;
}

.create-session-button {
	margin-top: 0.5em;
	font-size: 2.5em;
}

.create-session-button-holder {
	display: flex;
	flex-direction: column;
	align-items: center;
	flex-grow: 10000;
	align-self: center;
	min-width: 50vw;
	order: 6;
	gap: 1em;
}

@media screen and (min-width: 1880px) {
	.template-section {
		order: 5;
	}
}

.session-created {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	width: 100%;
	height: 100%;
}
</style>