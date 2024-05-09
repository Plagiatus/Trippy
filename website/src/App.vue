<template>
	<Navigation />
	<div id="main-view">
		<router-view></router-view>
	</div>
	<Footer />
	<trippy/>
</template>

<script setup lang="ts">
import Navigation from './components/Navigation.vue';
import Footer from './components/Footer.vue';
import useDependency from './composables/use-dependency';
import AuthenticationHandler from "./authentication-handler"
import Trippy from './components/Trippy.vue';

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