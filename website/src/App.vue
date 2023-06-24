<template>
	<Navigation />
	<div id="main-view">
		<router-view></router-view>
	</div>
	<Footer />
</template>

<script setup lang="ts">
import Navigation from './components/Navigation.vue';
import Footer from './components/Footer.vue';
import useProvidedItem from './composables/use-provided-item';
import AuthenticationHandler from "./authentication-handler"

const authenticationHandler = useProvidedItem(AuthenticationHandler);
authenticationHandler.getJwt(); //refresh jwt
</script>

<style>
#main-view {
	padding: 1em;
	margin-bottom: 2rem;
	height: calc(100vh - 4em);
}
</style>