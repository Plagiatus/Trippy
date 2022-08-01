<script lang="ts">
import Navigation from './components/Navigation.vue';
import Footer from './components/Footer.vue';
import { defineComponent } from "vue";

export default defineComponent({
	components: { Navigation, Footer },
})
</script>

<template>
	<Navigation />
	<div id="main-view">
		<router-view></router-view>
	</div>
	<Footer />
</template>

<style>
#main-view {
	padding: 1em;
	margin-bottom: 2rem;
}
</style>