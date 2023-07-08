<template>
	<div class="session-information">
		<template-edit-section class="section template-section" v-model:session-blueprint="sessionBlueprint" :session-form="form"/>
		<map-information-edit-section class="section" :session-blueprint="sessionBlueprint"/>
		<join-information-edit-section class="section" :session-blueprint="sessionBlueprint"/>
		<expectations-edit-section class="section" :session-blueprint="sessionBlueprint"/>
		<session-edit-section class="section" :session-blueprint="sessionBlueprint"/>
		<div class="create-session-button-holder">
			<normal-button class="create-session-button" @click="createSession">Create Session</normal-button>
		</div>
	</div>
</template>

<script setup lang="ts">
import { PartialSessionBlueprint } from '@/types/session-blueprint-types';
import { ref } from 'vue';
import NormalButton from '@/components/buttons/NormalButton.vue';
import MapInformationEditSection from '@/components/session/MapInformationEditSection.vue';
import JoinInformationEditSection from '@/components/session/JoinInformationEditSection.vue';
import ExpectationsEditSection from '@/components/session/ExpectationsEditSection.vue';
import SessionEditSection from '@/components/session/SessionEditSection.vue';
import { useValidateableForm } from '@/composables/use-validateable-form';
import TemplateEditSection from '@/components/session/TemplateEditSection.vue';

const sessionBlueprint = ref<PartialSessionBlueprint>({
	preferences: {players: {}},
	voiceChannels: [],
});

const form = useValidateableForm();

function createSession() {
	const isValid = form.validateForm();
	if (!isValid) {
		return;
	}

	alert("Create session");
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
	justify-content: center;
	flex-grow: 10000;
	align-self: center;
	min-width: 50vw;
	order: 6;
}

@media screen and (min-width: 1880px) {
	.template-section {
		order: 5;
	}
}
</style>