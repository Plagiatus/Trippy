<template>
	<section class="content-box">
		<div class="header-holder">
			<slot name="header">
				<p class="header-text">{{header}}</p>
			</slot>
		</div>
		<slot></slot>
	</section>
</template>

<script setup lang="ts">
defineProps<{
	header?: string;
}>()
</script>

<style scoped>

.content-box {
	background-color: var(--background2);
	padding: 0.5em 1em 1em 1em;
	border-radius: 0.5em;
}

.header-holder {
	margin-bottom: 0.5em;
}

.header-text {
	font-weight: bold;
	font-size: 1.5em;
}

</style>