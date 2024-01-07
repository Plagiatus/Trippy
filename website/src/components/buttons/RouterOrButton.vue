<template>
	<router-link v-if="routeTo" :to="routeTo">
		<slot></slot>
	</router-link>
	<button v-else>
		<slot></slot>
	</button>
</template>

<script setup lang="ts">
import { RouteLocationRaw } from 'vue-router';

defineProps<{
	routeTo?: RouteLocationRaw;
}>();
</script>