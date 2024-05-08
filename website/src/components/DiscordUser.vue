<template>
	<div
		class="discord-user"
	>
		<template v-if="user && user.avatar && user.name">
			<img :src="user.avatar" class="image"/>
			<p class="username">{{user.name}}</p>
		</template>
		<template v-else>
			<div class="image"></div>
			<p class="username unknown">Unknown user</p>
		</template>
		<slot>

		</slot>
	</div>
</template>

<script setup lang="ts">
import { DiscordUserInformationDto } from '$/types/dto-types';

defineProps<{
	user: DiscordUserInformationDto|undefined|null,
}>();
</script>

<style scoped>

.discord-user {
	display: flex;
	align-items: center;
	gap: 0.5em;
}

.image {
	width: 2em;
	height: 2em;
	border-radius: 100%;
}

.username.unknown {
	font-style: italic;
}
</style>