<template>
	<div class="loading-holder" v-if="!data.session">
		<loading-spinner v-if="!data.loadingError"/>
		<error-display hide-close-icon>
			<p v-if="data.loadingError">{{data.loadingError}}</p>
		</error-display>
	</div>
	<div class="session-information" v-else>
		<h1 class="header">Edit session {{data.session.id.toUpperCase()}}</h1>
		<map-information-edit-section class="section" :session-blueprint="data.session.blueprint"/>
		<join-information-edit-section class="section" :session-blueprint="data.session.blueprint"/>
		<expectations-edit-section class="section" :session-blueprint="data.session.blueprint"/>
		<session-edit-section class="section" :session-blueprint="data.session.blueprint"/>
		<div class="button-holder">
			<normal-button :route-to="{name: 'Session.Overview'}" class="option-button">Cancel</normal-button>
		</div>
		<div class="button-holder">
			<loading-button class="option-button"
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
import SessionApiClient from '@/api-clients/session-api-client';
import ErrorDisplay from '@/components/ErrorDisplay.vue';
import LoadingSpinner from '@/components/LoadingSpinner.vue';
import LoadingButton from '@/components/buttons/LoadingButton.vue';
import NormalButton from '@/components/buttons/NormalButton.vue';
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

const sessionApiClient = useProvidedItem(SessionApiClient);
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
	const response = await sessionApiClient.getSessionInformation(sessionId);
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

	const response = await sessionApiClient.updateSessionBlueprint(data.session?.id, data.session.blueprint);
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

.option-button {
	margin-top: 0.5em;
	font-size: 2.5em;
}

.button-holder {
	display: flex;
	flex-direction: column;
	align-items: center;
	flex-grow: 10000;
	align-self: center;
	min-width: 40vw;
	order: 6;
	gap: 1em;
}

.header {
	flex-grow: 1;
	min-width: 90vw;
	text-align: center;
}
</style>