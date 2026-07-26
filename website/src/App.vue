<template>
	<Navigation />
	<div id="main-view">
		<router-view></router-view>
	</div>
	<Footer />
	<popups-display />
	<trippy/>
</template>

<script setup lang="ts">
import Navigation from './components/Navigation.vue';
import Footer from './components/Footer.vue';
import PopupsDisplay from './components/dialogs/PopupsDisplay.vue';
import useDependency from './composables/use-dependency';
import AuthenticationHandler from "./authentication-handler"
import Trippy from './components/trippy/Trippy.vue';

const authenticationHandler = useDependency(AuthenticationHandler);
authenticationHandler.getJwt(); //refresh jwt
</script>

<style>
#main-view {
	padding: 1em;
	margin-bottom: 2rem;
	height: calc(100vh - 4em);
}
</style>