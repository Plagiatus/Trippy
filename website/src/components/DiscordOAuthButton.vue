<template>
	<button @click="startOAuth" class="discord-oauth-button">
		<span class="text">Login with Discord</span>
		<img class="image" src="/icons/Discord-Logo-White.svg" alt="Discord">
	</button>
</template>

<script setup lang="ts">
import useProvidedItem from '@/composables/use-provided-item';
import Config from '@/config';
import AuthenticationHandler from '@/authentication-handler';

const authenticationHandler = useProvidedItem(AuthenticationHandler);
const config = useProvidedItem(Config);

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
	background-color: transparent;
	border: none;
	cursor: pointer;
	border-radius: 0.3em;
}

.discord-oauth-button:hover {
	background-color: var(--dark);
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