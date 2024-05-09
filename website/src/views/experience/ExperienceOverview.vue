<template>
	<div v-if="experienceResponse.isLoading">
		<loading-spinner/>
	</div>
	<div v-else-if="experienceResponse.data" class="overview-page">
		<yes-no-dialog ref="deleteExperienceRef" header="Delete experience">
			Are you sure you want to delete <span class="delete-experience-name">{{experienceResponse.data.defaultBlueprint.name}}</span>?
		</yes-no-dialog>
		<content-box class="experience-overview">
			<img v-if="experienceResponse.data.defaultBlueprint.imageId" :src="imageApiClient.getImageLink(experienceResponse.data.defaultBlueprint.imageId)" class="experience-image"/>
			<div v-else class="experience-image"></div>
			<h1 class="map-name">{{experienceResponse.data.defaultBlueprint.name}}</h1>
			<div class="details">
				<template v-if="experienceResponse.data.owners.length > 0">
					<span class="detail-name">Owner{{experienceResponse.data.owners.length === 1 ? "" : "s"}}:</span>
					<div class="detail-value">
						<discord-user
							v-for="owner of experienceResponse.data.owners"
							:key="owner.id"
							:user="owner"
						/>
					</div>
				</template>
				<span class="detail-name">Edition:</span><span class="detail-value edition-value">{{experienceResponse.data.defaultBlueprint.edition}}</span>
				<template v-if="experienceResponse.data.defaultBlueprint.edition === 'java'">
					<span class="detail-name">Version:</span>
					<span class="detail-value">{{experienceResponse.data.defaultBlueprint.version}}</span>
				</template>
				<span class="detail-name">Players:</span><span class="detail-value">{{playerCountString}}</span>
			</div>
		</content-box>
		<div class="options">
			<normal-button v-if="experienceResponse.data.ownsExperience" :route-to="{name: 'Experience.Edit'}">Edit experience</normal-button>
			<normal-button v-if="experienceResponse.data.ownsExperience" :route-to="{name: 'Session.Create', params: {experienceId: experienceResponse.data.id}}">Create session for experience</normal-button>
			<loading-button v-if="experienceResponse.data.ownsExperience" :loading="data.isDeleting" color="danger" @click="startDeletingExperience">Delete experience</loading-button>
		</div>
	</div>
	<div v-else-if="experienceResponse.failedToLoad">
		<error-display :hide-close-icon="true">
			Failed to load experience.
		</error-display>
	</div>
</template>

<script setup lang="ts">
import ExperienceApiClient from '@/api-clients/experience-api-client';
import ImageApiClient from '@/api-clients/image-api-client';
import ContentBox from '@/components/ContentBox.vue';
import DiscordUser from '@/components/DiscordUser.vue';
import ErrorDisplay from '@/components/ErrorDisplay.vue';
import LoadingSpinner from '@/components/LoadingSpinner.vue';
import LoadingButton from '@/components/buttons/LoadingButton.vue';
import NormalButton from '@/components/buttons/NormalButton.vue';
import YesNoDialog from '@/components/dialogs/YesNoDialog.vue';
import useLoadData from '@/composables/use-load-data';
import useDependency from '@/composables/use-dependency';
import useRandomTrippyMessage from '@/composables/use-random-trippy-message';
import { computed, shallowReactive, shallowRef } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const experienceApiClient = useDependency(ExperienceApiClient);
const imageApiClient = useDependency(ImageApiClient);
const route = useRoute();
const router = useRouter();
const experienceResponse = useLoadData(() => experienceApiClient.getExperience(route.params.experienceId + ""), () => !!route.params.experienceId);

const deleteExperienceRef = shallowRef<InstanceType<typeof YesNoDialog>>();

const data = shallowReactive({
	isDeleting: false,
});

const playerCountString = computed(() => {
	const minPlayers = experienceResponse.data?.defaultBlueprint.preferences.players.min;
	const maxPlayers = experienceResponse.data?.defaultBlueprint.preferences.players.max;
	
	if (minPlayers === undefined && maxPlayers === undefined) {
		return "Unlimited"
	}
	if (minPlayers !== undefined && maxPlayers === undefined) {
		return minPlayers + "+";
	}
	if (minPlayers === undefined && maxPlayers !== undefined) {
		return "Max " + maxPlayers;
	}
	return minPlayers + "-" + maxPlayers;
});

async function startDeletingExperience() {
	if (!deleteExperienceRef.value || !experienceResponse.data) {
		return;
	}

	const result = await deleteExperienceRef.value.openDialog();
	if (!result) {
		return;
	}

	data.isDeleting = true;
	try {
		await experienceApiClient.deleteExperience(experienceResponse.data.id);
		router.push({name: "Experience"});
	} finally {
		data.isDeleting = false;
	}
}

useRandomTrippyMessage((add) => {
	if (!experienceResponse.data) {
		add({message: "Can't find the experience?\n\nMaybe try contacting a moderator?"});
		return;
	}

	add({message: "This experience sounds like fun.", mood: "suprised", weight: 2});
	add({message: "You don't have something better\nto do other than looking at this page?", mood: "tired", weight: 0.2});
	add({message: `${experienceResponse.data.defaultBlueprint.name} is a pretty good name for an experience.`, mood: "normal"});

	if (experienceResponse.data.ownsExperience) {
		add({mood: "normal", message: "Do you want to start a new\nsession for this experience?\n\nJust press the\n\"Create session for experience\" button."});
		add({mood: "suprised", message: "Can't wait for the next time you host a session for this!"});
		add({mood: "tired", message: "You gonna start a session soon?", weight: 0.2});
	} else {
		add({message: `You ever thought about why it's called ${experienceResponse.data.defaultBlueprint.name}?`, mood: "confused"});
		add({message: `Have you tried this experience?\nWas it fun?`, mood: "normal"});
	}
});
</script>

<style scoped>
.overview-page {
	display: flex;
	gap: 32px;
}

.experience-overview {
	display: flex;
	flex-flow: column;
	align-items: flex-start;
	width: 300px;
}

.map-name {
	text-align: center;
	width: 100%;
	padding: 16px 20px;
}

.details {
	display: grid;
	grid-template-columns: auto auto;
	gap: 8px;
	align-items: center;
}

.detail-name {
	font-weight: bold;
}

.edition-value {
	text-transform: capitalize;
}

.experience-image {
	border-radius: 6px;
	width: 100%;
	height: 200px;
	object-fit: cover;
	background-color: var(--highlight);
}

.options {
	display: flex;
	flex-flow: column;
	gap: 16px;
}

.delete-experience-name {
	color: var(--highlight);
}
</style>