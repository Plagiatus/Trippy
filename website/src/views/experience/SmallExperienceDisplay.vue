<template>
	<router-link class="experience-link" :to="{name: 'Experience.Overview', params: {experienceId: experience.id}}">
		<section class="experience">
			<img v-if="experience.imageId" :src="imageApiClient.getImageLink(experience.imageId)" class="experience-image"/>
			<div v-else class="experience-image"></div>
			<div class="experience-name-holder">
				<p class="experience-name">{{experience.name}}</p>
			</div>
		</section>
	</router-link>
</template>

<script setup lang="ts">
import ImageApiClient from '@/api-clients/image-api-client';
import useProvidedItem from '@/composables/use-provided-item';
import { SimplfiedExperienceInformationDto } from '$/types/dto-types';

defineProps<{
	experience: SimplfiedExperienceInformationDto,
}>();

const imageApiClient = useProvidedItem(ImageApiClient);
</script>

<style scoped>
.experience-link {
	display: block;
	width: fit-content;
}

.experience {
	display: flex;
	flex-flow: column;
	width: 200px;
	border-radius: 8px;
	background-color: var(--background2);
	overflow: hidden;
	padding: 2px;
}

.experience:hover {
	box-shadow: 2px 2px 5px 0 #00000030;
}

.experience-image {
	border-top-right-radius: 6px;
	border-top-left-radius: 6px;
	width: 100%;
	height: 100px;
	object-fit: cover;
	background-color: var(--highlight);
}

.experience-name-holder {
	width: 100%;
	flex-grow: 1;
	padding: 16px;
}

.experience-name {
	text-align: center;
}
</style>