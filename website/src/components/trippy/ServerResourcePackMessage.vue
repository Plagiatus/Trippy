<template>
	<div class="resource-pack-message">
		<p>It looks like players will need to download a resource pack to play during your session.</p>
		<p>
			Did you know you can add it as a
			<component
				:is="config.serverResourcePackGuideUrl ? 'a' : 'span'"
				:href="config.serverResourcePackGuideUrl" target="_blank"
				class="guide-link"
			>server resource pack</component>
			to make players download it automatically?
		</p>
	</div>
</template>

<script setup lang="ts">
import useDependency from '@/composables/use-dependency';
import Config from '@/config';

const config = useDependency(Config);
</script>

<style scoped>
.resource-pack-message {
	max-width: 300px;
}

a.guide-link {
	color: var(--highlight);
	text-decoration: underline;
}
</style>