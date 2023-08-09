<template>
	<div class="loading-holder" v-if="!data.session">
		<loading-spinner v-if="!data.loadingError"/>
		<error-display hide-close-icon>
			<p v-if="data.loadingError">{{data.loadingError}}</p>
		</error-display>
	</div>
	<div class="session-information" v-else>
		<content-box header="Users" class="section users-section">
			<div
				v-for="user of data.session.users"
				:key="user.id"
				class="user-row"
			>
				<img v-if="user.avatar" :src="user.avatar" class="user-image"/>
				<div v-else class="user-image"></div>
				{{user.name}}
			</div>
		</content-box>
		<map-information-edit-section class="section" :session-blueprint="data.session.blueprint"/>
		<join-information-edit-section class="section" :session-blueprint="data.session.blueprint"/>
		<expectations-edit-section class="section" :session-blueprint="data.session.blueprint"/>
		<session-edit-section class="section" :session-blueprint="data.session.blueprint"/>
		<div class="update-session-button-holder">
			<loading-button class="update-session-button"
				:loading="data.isUpdatingSession"
				text="Update Session"
				:success-text="data.updateSessionError ? undefined : 'Updated!'"
				@click="updateSession"
			/>
			<error-display @close="data.updateSessionError = ''">
				<p v-if="data.updateSessionError">{{data.updateSessionError}}</p>
			</error-display>
		</div>
	</div>
</template>

<script setup lang="ts">
import SessionsApiClient from '@/api-clients/sessions-api-client';
import ContentBox from '@/components/ContentBox.vue';
import ErrorDisplay from '@/components/ErrorDisplay.vue';
import LoadingSpinner from '@/components/LoadingSpinner.vue';
import LoadingButton from '@/components/buttons/LoadingButton.vue';
import ExpectationsEditSection from '@/components/session/ExpectationsEditSection.vue';
import JoinInformationEditSection from '@/components/session/JoinInformationEditSection.vue';
import MapInformationEditSection from '@/components/session/MapInformationEditSection.vue';
import SessionEditSection from '@/components/session/SessionEditSection.vue';
import useProvidedItem from '@/composables/use-provided-item';
import { useValidateableForm } from '@/composables/use-validateable-form';
import { SessionInformationDto } from '@/types/dto-types';
import { reactive, watchEffect } from 'vue';
import { useRoute } from 'vue-router';

const data = reactive({
	session: null as null | SessionInformationDto,
	loadingError: null as null | string,
	isUpdatingSession: false,
	updateSessionError: "",
});

const sessionsApiClient = useProvidedItem(SessionsApiClient);
const route = useRoute();
const form = useValidateableForm();

watchEffect(async (cleanUp) => {
	//Load session information based on route.params["sessionId"]
	let useResult = true;
	data.session = null;

	cleanUp(()=> {
		useResult = false;
	});

	const sessionId = [route.params["sessionId"]].flat()[0];
	const response = await sessionsApiClient.getSessionInformation(sessionId);
	if (!useResult) {
		return;
	}

	if (response.data) {
		data.session = response.data;
	} else {
		data.loadingError = response.statusError?.statusText ?? (response.error + "");
	}
})

async function updateSession() {
	if (!data.session || !form.validateForm()) {
		return;
	}
	data.updateSessionError = "";
	data.isUpdatingSession = true;

	const response = await sessionsApiClient.updateSessionBlueprint(data.session?.id, data.session.blueprint);
	data.isUpdatingSession = false;
	if (!response.data) {
		data.updateSessionError = response.statusError?.statusText ?? (response.error + "");
	}
}
</script>

<style scoped>
.loading-holder {
	display: flex;
	justify-content: center;
	align-items: center;
	height: 100%;
}

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

.update-session-button {
	margin-top: 0.5em;
	font-size: 2.5em;
}

.update-session-button-holder {
	display: flex;
	flex-direction: column;
	align-items: center;
	flex-grow: 10000;
	align-self: center;
	min-width: 50vw;
	order: 6;
	gap: 1em;
}

.users-section {
	min-height: 200px;
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