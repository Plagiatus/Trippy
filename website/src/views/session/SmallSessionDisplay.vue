<template>
	<router-link class="session-link" :to="{name: 'Session.Overview', params: {sessionId: session.uniqueId ?? '-'}}">
		<section class="session">
			<img v-if="session.imageId" :src="imageApiClient.getImageLink(session.imageId)" class="session-image"/>
			<div v-else class="session-image"></div>
			<div class="session-name-holder">
				<p class="session-name">{{session.name}} ({{session.id.toUpperCase()}})</p>
			</div>
		</section>
	</router-link>
</template>

<script setup lang="ts">
import ImageApiClient from '@/api-clients/image-api-client';
import useProvidedItem from '@/composables/use-provided-item';
import { SimplifiedSessionInformationDto } from '$/types/dto-types';

defineProps<{
	session: SimplifiedSessionInformationDto
}>();

const imageApiClient = useProvidedItem(ImageApiClient);
</script>

<style scoped>
.session-link {
	display: block;
	width: fit-content;
}

.session {
	display: flex;
	flex-flow: column;
	width: 200px;
	border-radius: 8px;
	background-color: var(--background2);
	overflow: hidden;
	padding: 2px;
}

.session:hover {
	box-shadow: 2px 2px 5px 0 #00000030;
}

.session-image {
	border-top-right-radius: 6px;
	border-top-left-radius: 6px;
	width: 100%;
	height: 100px;
	object-fit: cover;
	background-color: var(--highlight);
}

.session-name-holder {
	width: 100%;
	flex-grow: 1;
	padding: 16px;
}

.session-name {
	text-align: center;
}
</style>