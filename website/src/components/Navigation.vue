<template>
	<header id="nav-spacer">
		<nav id="main-nav">
			<div id="nav-logo-wrapper">
				<router-link class="nav-link-logo" :to="{name: 'Home'}">
					<img id="nav-logo" src="/logo.png" alt="">
				</router-link>
			</div>
			<navigation-button :route-to="{name: 'Home'}">Home</navigation-button>
			<template v-if="authenticationHandler.isLoggedIn()">
				<navigation-button :route-to="{name: 'Experience'}">Experiences</navigation-button>
				<navigation-button :route-to="{name: 'Session'}">Sessions</navigation-button>
			</template>
			<navigation-button :route-to="{name: 'Stats'}">Stats</navigation-button>
			<span id="discord-in-nav">
				<logged-in-user-display v-if="authenticationHandler.isLoggedIn()"/>
				<discord-o-auth-button v-else/>
			</span>
		</nav>
	</header>
</template>

<script setup lang="ts">
import AuthenticationHandler from "@/authentication-handler";
import useDependency from "@/composables/use-dependency";
import DiscordOAuthButton from "./buttons/DiscordOAuthButton.vue";
import LoggedInUserDisplay from "./LoggedInUserDisplay.vue";
import NavigationButton from "./buttons/NavigationButton.vue";

const authenticationHandler = useDependency(AuthenticationHandler);
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