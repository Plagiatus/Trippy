<template>
	<div class="tag">
		{{tagInformation.icon}} {{tagInformation.name}}
	</div>
</template>

<script setup lang="ts">
import TagsHelper, { TagInformation } from '$/tags-helper';
import useDependency from '@/composables/use-dependency';
import { computed } from 'vue';

const props = defineProps<{
	tag: TagInformation|string;
}>();

const tagsHelper = useDependency(TagsHelper);

const tagInformation = computed(() => {
	if (typeof props.tag === "string") {
		return tagsHelper.getTag(props.tag);
	}
	return props.tag;
});
</script>

<style scoped>
.tag {
	background-color: var(--background);
	color: var(--text-color);
	padding: 0.125rem 0.5rem;
	border-radius: 4px;
}
</style>