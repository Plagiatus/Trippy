<template>
	<navigation-button class="discord-oauth-button" @click="startOAuth">
		<span class="text">Login with Discord</span>
		<img class="image" src="/icons/Discord-Logo-White.svg" alt="Discord">
	</navigation-button>
</template>

<script setup lang="ts">
import useDependency from '@/composables/use-dependency';
import Config from '@/config';
import AuthenticationHandler from '@/authentication-handler';
import NavigationButton from './NavigationButton.vue';

const authenticationHandler = useDependency(AuthenticationHandler);
const config = useDependency(Config);

function startOAuth() {
	authenticationHandler.redirectToOAuth({
		clientId: config.discordOAuthClientId,
		oAuthUrl: "https://discord.com/oauth2/authorize",
		scope: "identify",
		type: "discord",
	});
}
</script>

<style scoped>

.discord-oauth-button {
	display: flex;
	align-items: center;
}

.text {
	color: var(--text-color);
	margin-right: 0.5em;
}

.image {
	width: 2.5em;
	height: 2.5em;
}
</style>