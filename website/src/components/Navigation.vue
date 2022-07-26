<template>
	<div id="nav-spacer">
		<nav id="main-nav">
			<div id="nav-logo-wrapper">
				<router-link class="nav-link-logo" to="/">
					<img id="nav-logo" src="@/assets/logo.png" alt="">
				</router-link>
			</div>
			<router-link class="nav-link" to="/">Home</router-link>
			<router-link class="nav-link" to="/session">Session</router-link>
			<router-link class="nav-link" to="/profile">Profiles</router-link>
		</nav>
	</div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
	name: "Navigation",
});
</script>

<style>
nav#main-nav {
	width: 100%;
	position: fixed;
	top: 0;
	background-color: var(--background2);
	display: flex;
	align-items: center;
	padding: .5em;
}

div#nav-spacer, nav#main-nav {
	height: 4em;
}

.nav-link {
	color: var(--text-color);
	padding: 0.25em 0.5em;
	margin: 0 0.1em;
	text-decoration: none;
	border-radius: 0.3em;
}

.nav-link:hover {
	background-color: var(--dark);
}

.nav-link.router-link-active {
	background-color: var(--background);
}

img#nav-logo{
	width: 3em;
	height: 3em;
	border-radius: 5px;
}
div#nav-logo-wrapper {
	margin-right: 1em;
}
</style>