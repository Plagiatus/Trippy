<template>
	<blueprint-details :blueprint="experience.defaultBlueprint">
		<template #extra-details>
			<template v-if="experience.owners.length > 0">
				<span class="detail-name">Owner{{experience.owners.length === 1 ? '' : 's'}}:</span>
				<div class="detail-value">
					<discord-user
						v-for="owner of experience.owners"
						:key="owner.id"
						:user="owner"
					/>
				</div>
			</template>
		</template>
	</blueprint-details>
</template>

<script setup lang="ts">
import BlueprintDetails from '@/components/BlueprintDetails.vue';
import DiscordUser from '@/components/DiscordUser.vue';
import type { ExperienceInformationDto } from '$/types/dto-types';

const props = defineProps<{
	experience: ExperienceInformationDto;
}>();
</script>
