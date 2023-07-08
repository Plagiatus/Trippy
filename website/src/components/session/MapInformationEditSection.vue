<template>
	<content-box header="Map Information">
		<input-field v-model="sessionBlueprint.name" type="text" name="Name" class="input-row" required/>
		<input-textarea v-model="sessionBlueprint.description" name="Description" class="input-row" required/>
		<input-select v-model="sessionBlueprint.category" :values="categoryOptions" name="Category" class="input-row" required/>
		<input-field v-model="sessionBlueprint.image" type="text" name="Image" placeholder="www.example.com/image" class="input-row" pattern="^(.+:\/\/)?([^.]+\.)+[^.]+(\/.)?"/>
	</content-box>
</template>

<script setup lang="ts">
import InputField from '@/components/inputs/InputField.vue';
import InputTextarea from '@/components/inputs/InputTextarea.vue';
import InputSelect from '@/components/inputs/InputSelect.vue';
import { PartialSessionBlueprint, SessionBlueprint } from '@/types/session-blueprint-types';
import ContentBox from '../ContentBox.vue';

defineProps<{
	sessionBlueprint: PartialSessionBlueprint;
}>()

const categoryOptions: InputSelectValueType<SessionBlueprint["category"]>[] = [
	{value: "ctm", name: "CTM"},
	{value: "hns", name: "Hide and Seek"},
	{value: "multiple", name: "Multiple"},
	{value: "other", name: "Other"},
	{value: "parkour", name: "Parkour"},
	{value: "puzzle", name: "Puzzle"},
	{value: "pve", name: "PvE"},
	{value: "pvp", name: "PvP"},
	{value: "stategy", name: "Strategy"},
]
</script>

<style scoped>
.input-row:not(:last-child) {
	margin-bottom: 1em;
}
</style>