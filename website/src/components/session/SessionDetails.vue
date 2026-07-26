<template>
	<blueprint-details :blueprint="session.blueprint" :sub-header="session.id">
		<template #extra-details>
			<span class="detail-name">Host:</span><discord-user class="detail-value" :user="session.host"/>
			<template v-if="session.experience">
				<span class="detail-name">Experience:</span>
				<router-link
					:to="{
						name: 'Experience.Overview',
						params: {
							experienceId: session.experience.id,
						}
					}"
					class="detail-value experience-link"
				>
						{{session.experience.name}}
				</router-link>
			</template>
			<template v-if="session.startedAt !== null && session.startedAt !== undefined">
				<span class="detail-name">Started at:</span><span class="detail-value">{{timeHelper.formatDateTime(new Date(session.startedAt))}}</span>
			</template>
		</template>
	</blueprint-details>
</template>

<script setup lang="ts">
import BlueprintDetails from '@/components/BlueprintDetails.vue';
import DiscordUser from '@/components/DiscordUser.vue';
import TimeHelper from '@/time-helper';
import useDependency from '@/composables/use-dependency';
import type { SessionInformationDto } from '$/types/dto-types';

const props = defineProps<{
	session: SessionInformationDto;
}>();

const timeHelper = useDependency(TimeHelper);
</script>

<style scoped>
.experience-link {
	color: var(--highlight);
	text-decoration: underline;
}
</style>