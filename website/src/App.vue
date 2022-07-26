<script lang="ts">
import Navigation from './components/Navigation.vue';
import { defineComponent } from "vue";

export default defineComponent({
	components: { Navigation },
})
</script>

<template>
	<Navigation />
	<div id="main-view">
		<router-view></router-view>
	</div>
</template>

<style>
#main-view {
	padding: 1em;
}
</style>