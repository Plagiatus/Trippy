<template>
	<div>
		<form id="empty-feedback-wrapper" v-if="!$route.params.feedbackId">
			<label for="feedbackID">Looking for your feedback? Enter the UUID here: </label>
			<br>
			<input type="text" name="feedbackID" id="feedbackID" v-model="data.feedbackId"
				placeholder="9623e042-60af-443e-9b32-79cc077bd5d2" size="36" required>
			<button class="btn" @click="updateID">GO</button>
		</form>
		<div id="filled-feedback-wrapper" v-else>
			<span id="feedback-id-display">
				Feedback with id: {{ data.feedbackId }}
			</span>
		</div>
		<div id="error-wrapper" v-if="data.error" class="error-display">
			<span>{{ data.error }}</span>
		</div>
		<div id="error-loading-feedback" v-if="data.error && typeof data.error === 'object' && 'code' in data.error && data.error.code == 404">
			<span class="error-display">Feedback with code {{ data.feedbackId }} not found. Please ensure you have the
				correct code!</span>
			<br>
			<input type="text" v-model="data.feedbackId" placeholder="9623e042-60af-443e-9b32-79cc077bd5d2" size="36">
			<button class="btn" @click="updateID" required>GO</button>
		</div>
	</div>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from "vue-router";
import { shallowReactive, watch } from "vue";
import FeedbackApiClient from "@/api-clients/feedback-api-client";
import useProvidedItem from "@/composables/use-provided-item";

const route = useRoute();
const router = useRouter();
const feedbackClient = useProvidedItem(FeedbackApiClient);
const data = shallowReactive({
	feedbackId: "",
	error: "" as unknown,
});

function updateID() {
	if(!data.feedbackId) return;
	router.push({ name: "Sessions.Feedback", params: { feedbackId: data.feedbackId } })
}

async function loadFeedback() {
	data.error = "";
	if(!data.feedbackId) return;

	const reply = await feedbackClient.getFeedbackForUUID(data.feedbackId);
	if (reply.error) {
		data.error = reply.error;
		return;
	}
}

watch(() => route.params.feedbackId, () => {
	const feedbackIdParameter = route.params.feedbackId;
	data.feedbackId = Array.isArray(feedbackIdParameter) ? (feedbackIdParameter[0] ?? "") : feedbackIdParameter;
	loadFeedback();
}, {immediate: true})
</script>

<style>
#feedback-id-display {
	width: 100%;
	text-align: right;
	color: darkslategray;
	display: inline-block;
}
</style>