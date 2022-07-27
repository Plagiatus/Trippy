<template>
	<div>
		<form id="empty-feedback-wrapper" v-if="!$route.params.feedbackId">
			<label for="feedbackID">Looking for your feedback? Enter the UUID here: </label>
			<br>
			<input type="text" name="feedbackID" id="feedbackID" v-model="feedbackId"
				placeholder="9623e042-60af-443e-9b32-79cc077bd5d2" size="36" required>
			<button class="btn" @click="updateID">GO</button>
		</form>
		<div id="filled-feedback-wrapper" v-else>
			<span id="feedback-id-display">
				Feedback with id: {{ feedbackId }}
			</span>
		</div>
		<div id="error-wrapper" v-if="error" class="error-display">
			<span>{{ error }}</span>
		</div>
		<div id="error-loading-feedback" v-if="error && error.code == 404">
			<span class="error-display">Feedback with code {{ feedbackId }} not found. Please ensure you have the
				correct code!</span>
			<br>
			<input type="text" v-model="feedbackId" placeholder="9623e042-60af-443e-9b32-79cc077bd5d2" size="36">
			<button class="btn" @click="updateID" required>GO</button>
		</div>
	</div>
</template>

<script lang="ts">
import request from "@/mixins/request";
import { router } from "@/router";
import { defineComponent } from "vue";

export default defineComponent({
	mixins: [request],
	data() {
		return {
			feedbackId: this.$route.params.feedbackId,
			error: "" as any,
		}
	},
	methods: {
		updateID() {
			if(!this.feedbackId) return;
			router.push({ name: "Sessions.Feedback", params: { feedbackId: this.feedbackId } })
		},
		async loadFeedback() {
			this.error = "";
			if(!this.feedbackId) return;
			// console.log("load Feedback:", this.feedbackId);
			const reply = await this.sendRequest(`feedback/${this.feedbackId}`, "GET");
			if (reply.error) {
				this.error = reply.error;
				return;
			}
		},
	},
	created() {
		this.$watch(
			() => this.$route.params,
			(toParams: any) => {
				this.feedbackId = toParams.feedbackId;
				this.loadFeedback();
			}
		);
		if (this.$route.params.feedbackId) this.loadFeedback();
	},
})
</script>


<style>
#feedback-id-display {
	width: 100%;
	text-align: right;
	color: darkslategray;
	display: inline-block;
}
</style>