<template>
	<content-box header="Template">
		<p><span class="highlight-text">Notice:</span> Loading a template will <span class="highlight-text">override</span> your inputs.</p>
		<div class="template-row">
			<input-field
				v-model="data.templateCode"
				name="Template Code"
				type="text"
				placeholder="Template Code"
				class="template-code-input"
				pattern="^[a-zA-Z0-9]{5}$"
				:min="5"
				:max="5"
				hide-label
			/>
			<loading-button
				:disabled="!data.templateCode || data.isGeneratingTemplateCode"
				:loading="data.isLoadingTemplate"
				text="Load Template"
				:success-text="data.templateLoadingError ? undefined : 'Loaded!'"
				color="background"
				@click="loadTemplate"
			/>
		</div>
		<error-display @close="data.templateLoadingError = ''">
			<p v-if="data.templateLoadingError">{{data.templateLoadingError}}</p>
		</error-display>
		<div class="save-template-button-holder">
			<loading-button
				:disabled="data.isLoadingTemplate"
				:loading="data.isGeneratingTemplateCode"
				text="Save Template"
				:success-text="data.templateCodeGenerationError ? undefined : 'Saved!'"
				color="background"
				pattern="^[a-zA-Z0-9]{5}$"
				@click="saveTemplate"
			/>
		</div>
		<transition-size>
			<div class="template-row" v-if="data.generatedTemplateCode">
				<input-field v-model="data.generatedTemplateCode" readonly type="text" class="template-code-input"/>
				<copy-button :value="data.generatedTemplateCode"/>
			</div>
		</transition-size>
		<error-display @close="data.templateCodeGenerationError = ''">
			<p v-if="data.templateCodeGenerationError">{{data.templateCodeGenerationError}}</p>
		</error-display>
	</content-box>
</template>

<script setup lang="ts">
import { PartialSessionBlueprint, SessionBlueprint } from '@/types/session-blueprint-types';
import { shallowReactive } from 'vue';
import SessionsApiClient from '@/api-clients/sessions-api-client';
import ContentBox from '@/components/ContentBox.vue';
import LoadingButton from '@/components/buttons/LoadingButton.vue';
import ErrorDisplay from '@/components/ErrorDisplay.vue';
import useProvidedItem from '@/composables/use-provided-item';
import InputField from '@/components/inputs/InputField.vue';
import CopyButton from '@/components/buttons/CopyButton.vue';
import TransitionSize from '@/components/TransitionSize.vue';
import ValidateableForm from '@/validateable-form';
import { useValidateableForm } from '@/composables/use-validateable-form';

const props = defineProps<{
	sessionBlueprint: PartialSessionBlueprint;
	sessionForm?: ValidateableForm;
}>();

const emit = defineEmits<{
	(event: "update:sessionBlueprint", sessionBlueprint: PartialSessionBlueprint): void
}>();

const templateLoadForm = useValidateableForm();

const data = shallowReactive({
	templateCode: "",
	generatedTemplateCode: "",
	isLoadingTemplate: false,
	isGeneratingTemplateCode: false,
	templateLoadingError: "",
	templateCodeGenerationError: "",
});

const sessionApiClient = useProvidedItem(SessionsApiClient);

async function loadTemplate() {
	if (!templateLoadForm.validateForm()) {
		return;
	}

	data.templateLoadingError = "";
	data.isLoadingTemplate = true;

	const templateResponse = await sessionApiClient.getTemplateByCode(data.templateCode);
	data.isLoadingTemplate = false;

	if (!templateResponse.data) {
		if (templateResponse.statusError) {
			data.templateLoadingError = templateResponse.statusError.statusText;
		} else {
			data.templateLoadingError = templateResponse.error + "";
		}
		return;
	}

	emit("update:sessionBlueprint", templateResponse.data)
	data.templateCode = "";
}

async function saveTemplate() {
	if (!props.sessionForm?.validateForm()) {
		return;
	}

	data.generatedTemplateCode = "";
	data.templateCodeGenerationError = "";
	data.isGeneratingTemplateCode = true;

	const codeResponse = await sessionApiClient.createTemplateCode(props.sessionBlueprint as SessionBlueprint);
	data.isGeneratingTemplateCode = false;

	if (!codeResponse.data) {
		if (codeResponse.statusError) {
			data.templateCodeGenerationError = codeResponse.statusError.statusText;
		} else {
			data.templateCodeGenerationError = codeResponse.error + "";
		}
		return;
	}

	data.generatedTemplateCode = codeResponse.data.code;
}
</script>

<style scoped>
.template-row {
	display: flex;
	align-items: center;
	margin: 0.75em 0;
}

.save-template-button-holder {
	display: flex;
	justify-content: center;
	width: 100%;
	margin-top: 2em;
	margin-bottom: 0.75em;
}

.highlight-text {
	color: var(--highlight);
}

.template-code-input {
	flex-grow: 1;
	margin-right: 1em;
}
</style>