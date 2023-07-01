<template>
	<header id="nav-spacer">
		<nav id="main-nav">
			<div id="nav-logo-wrapper">
				<router-link class="nav-link-logo" to="/">
					<img id="nav-logo" src="/logo.png" alt="">
				</router-link>
			</div>
			<navigation-button route-to="/">Home</navigation-button>
			<template v-if="authenticationHandler.isLoggedIn()">
				<navigation-button route-to="/session">Session</navigation-button>
				<navigation-button route-to="/profile">Profiles</navigation-button>
			</template>
			<span id="discord-in-nav">
				<logged-in-user-display v-if="authenticationHandler.isLoggedIn()"/>
				<discord-o-auth-button v-else/>
			</span>
		</nav>
	</header>
</template>

<script setup lang="ts">
import AuthenticationHandler from "@/authentication-handler";
import useProvidedItem from "@/composables/use-provided-item";
import DiscordOAuthButton from "./DiscordOAuthButton.vue";
import LoggedInUserDisplay from "./LoggedInUserDisplay.vue";
import NavigationButton from "./NavigationButton.vue";

const authenticationHandler = useProvidedItem(AuthenticationHandler);
</script>

<style>
header {
	z-index: 1000;
	position: relative;
}

nav#main-nav {
	width: 100%;
	position: fixed;
	top: 0;
	background-color: var(--background2);
	display: flex;
	align-items: center;
	padding: .5em;
}

header#nav-spacer,
nav#main-nav {
	height: 4em;
}

img#nav-logo {
	width: 3em;
	height: 3em;
	border-radius: 5px;
}

div#nav-logo-wrapper {
	margin-right: 1em;
}

#discord-in-nav {
	flex-grow: 1;
	display: flex;
	justify-content: flex-end;
}
</style>