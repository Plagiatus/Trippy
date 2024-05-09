<template>
	<content-box header="Map Information">
		<input-field v-model="sessionBlueprint.name" type="text" name="Name" class="input-row" required/>
		<input-textarea v-model="sessionBlueprint.description" name="Description" class="input-row" required/>
		<input-multi-select v-model="sessionBlueprint.tags" :values="possibleTags" name="Tags" class="input-row" required>
			<template #selected="{value}">
				<tag-display :tag="value"/>
			</template>
		</input-multi-select>
		<template v-if="authenticationHandler.userInformation?.canUseImages">
			<normal-button @click="uploadImage" color="highlight" class="upload-button">Upload image</normal-button>
			<transition-size>
				<div v-if="image === null ? false : (data.newImage ?? props.sessionBlueprint.imageId)" class="image-holder">
					<img class="map-image" :src="data.newImage ?? imageApiClient.getImageLink(props.sessionBlueprint.imageId)"/>
					<normal-button @click="removeImage" color="highlight">Remove</normal-button>
				</div>
			</transition-size>
		</template>
	</content-box>
</template>

<script setup lang="ts">
import InputField from '@/components/inputs/InputField.vue';
import InputTextarea from '@/components/inputs/InputTextarea.vue';
import { PartialSessionBlueprint } from '$/types/session-blueprint-types';
import ContentBox from '../ContentBox.vue';
import NormalButton from '../buttons/NormalButton.vue';
import useDependency from '@/composables/use-dependency';
import FileAccess from '@/file-access';
import TransitionSize from '../TransitionSize.vue';
import { shallowReactive } from 'vue';
import ImageApiClient from '@/api-clients/image-api-client';
import AuthenticationHandler from '@/authentication-handler';
import InputMultiSelect from '../inputs/InputMultiSelect.vue';
import TagsHelper from '$/tags-helper';
import { InputSelectValueType } from '@/types/types';
import TagDisplay from '../TagDisplay.vue';

const props = defineProps<{
	sessionBlueprint: PartialSessionBlueprint;
}>();
const data = shallowReactive({
	newImage: undefined as undefined|string,
})
const image = defineModel<Blob|null>("image");

const imageApiClient = useDependency(ImageApiClient);
const fileAccess = useDependency(FileAccess);
const authenticationHandler = useDependency(AuthenticationHandler);
const tagsHelper = useDependency(TagsHelper);

const possibleTags = tagsHelper.getAllTags().map<InputSelectValueType<string>>(tag => ({
	value: tag.id,
	name: `${tag.icon} ${tag.name}`,
}))

async function uploadImage() {
	const imageFile = await fileAccess.openFileDialog({accept: ".png,.jpg"});
	const imageElement = await fileAccess.imageFromFile(imageFile);
	const maxWidth = 1280;
	const maxHeight = 720;
	const sizeScale = Math.min(maxWidth / imageElement.width, maxHeight / imageElement.height, 1);
	const bitmap = await createImageBitmap(imageElement, {
		resizeWidth: imageElement.width * sizeScale,
		resizeHeight: imageElement.height * sizeScale,
	});
	const imageBlob = await fileAccess.bitmapToBlob(bitmap);
	image.value = imageBlob;
	data.newImage = await fileAccess.blobToBase64Uri(imageBlob);
}

function removeImage() {
	image.value = null;
}
</script>

<style scoped>
.input-row:not(:last-child) {
	margin-bottom: 1em;
}

.image-holder {
	display: flex;
	justify-content: center;
	align-items: center;
	padding-top: 16px;
	gap: 16px;
}

.map-image {
	min-width: 100px;
	max-width: 300px;
	min-height: 66px;
	max-height: 200px;
	object-fit: contain;
	background-color: black;
	border: 1px solid var(--highlight);
}

.upload-button {
	width: 100%;
}
</style>