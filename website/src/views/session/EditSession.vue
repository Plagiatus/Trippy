<template>
	<div class="loading-holder" v-if="!data.session">
		<loading-spinner v-if="!data.loadingError"/>
		<error-display hide-close-icon>
			<p v-if="data.loadingError">{{data.loadingError}}</p>
		</error-display>
	</div>
	<div class="session-information" v-else-if="data.session.isHost">
		<h1 class="header">Edit session {{data.session.id.toUpperCase()}}</h1>
		<map-information-edit-section class="section" :session-blueprint="data.session.blueprint" v-model:image="data.newImage"/>
		<join-information-edit-section class="section" :session-blueprint="data.session.blueprint"/>
		<expectations-edit-section class="section" :session-blueprint="data.session.blueprint"/>
		<session-edit-section class="section" :session-blueprint="data.session.blueprint" :is-editing-session="true"/>
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
	<div v-else>
		<error-display hide-close-icon>
			<p>You are not able to edit this session.</p>
		</error-display>
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
import useDependency from '@/composables/use-dependency';
import { useValidateableForm } from '@/composables/use-validateable-form';
import { SessionInformationDto } from '$/types/dto-types';
import { reactive, watchEffect } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const data = reactive({
	session: null as null | SessionInformationDto,
	loadingError: null as null | string,
	isUpdatingSession: false,
	updateSessionError: "",
	newImage: undefined as undefined|Blob|null,
});

const sessionApiClient = useDependency(SessionApiClient);
const route = useRoute();
const router = useRouter();
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
	if (!data.session || !data.session.isHost || !form.validateForm()) {
		return;
	}
	data.updateSessionError = "";
	data.isUpdatingSession = true;

	const response = await sessionApiClient.updateSessionBlueprint({
		sessionId: data.session?.id,
		blueprint: data.session.blueprint,
		image: data.newImage,
	});
	data.isUpdatingSession = false;
	if (!response.data) {
		data.updateSessionError = response.statusError?.statusText ?? (response.error + "");
		return;
	}

	router.push({name: "Session.Overview"});
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