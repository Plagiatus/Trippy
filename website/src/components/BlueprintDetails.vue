<template>
	<content-box class="blueprint-details">
		<img v-if="blueprint.imageId" :src="imageApiClient.getImageLink(blueprint.imageId)" class="blueprint-image" />
		<div v-else class="blueprint-image"></div>
		<h1 class="map-name">{{blueprint.name}}</h1>
		<h2 v-if="subHeader" class="sub-header">({{subHeader}})</h2>
		<div class="details">
			<span class="detail-name">Edition:</span>
			<span class="detail-value edition-value">{{blueprint.edition}}</span>
			<template v-if="blueprint.edition === 'java' && blueprint.version">
				<span class="detail-name">Version:</span>
				<span class="detail-value">{{blueprint.version}}</span>
			</template>
			<span class="detail-name">Players:</span>
			<span class="detail-value">{{playerCountString}}</span>
			<slot name="extra-details" />
		</div>
	</content-box>
</template>

<script setup lang="ts">
import ContentBox from '@/components/ContentBox.vue';
import ImageApiClient from '@/api-clients/image-api-client';
import { computed } from 'vue';
import useDependency from '@/composables/use-dependency';
import type { SessionBlueprint, SimplifiedSessionBlueprint } from '$/types/session-blueprint-types';

const props = defineProps<{
	blueprint: SessionBlueprint | SimplifiedSessionBlueprint;
	subHeader?: string;
}>();

const imageApiClient = useDependency(ImageApiClient);

const playerCountString = computed(() => {
	const minPlayers = props.blueprint.preferences.players.min;
	const maxPlayers = props.blueprint.preferences.players.max;

	if (minPlayers === undefined && maxPlayers === undefined) {
		return 'Unlimited';
	}
	if (minPlayers !== undefined && maxPlayers === undefined) {
		return `${minPlayers}+`;
	}
	if (minPlayers === undefined && maxPlayers !== undefined) {
		return `Max ${maxPlayers}`;
	}
	return `${minPlayers}-${maxPlayers}`;
});
</script>

<style scoped>
.blueprint-details {
	display: flex;
	flex-flow: column;
	align-items: flex-start;
	width: 300px;
}

.sub-header {
	text-align: center;
	width: 100%;
	padding: 16px 20px;
	padding-top: 0;
}

.map-name {
	text-align: center;
	width: 100%;
	padding: 16px 20px;
	padding-bottom: 0;
}

.details {
	display: grid;
	grid-template-columns: auto auto;
	gap: 8px;
	align-items: center;
}

.blueprint-image {
	border-radius: 6px;
	width: 100%;
	height: 200px;
	object-fit: cover;
	background-color: var(--highlight);
}

:deep(.edition-value) {
	text-transform: capitalize;
}

:deep(.detail-name) {
	font-weight: bold;
}
</style>
