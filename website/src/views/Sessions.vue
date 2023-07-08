<template>
	<div id="sessions-wrapper">
		<big-icon-button icon="/icons/add.svg" title="Set up a new session" :routeTo="{ name: 'Sessions.Setup' }"/>
		<big-icon-button icon="/icons/user-feedback.svg" title="View feedback" :routeTo="{ name: 'Sessions.Feedback' }"/>
	</div>
</template>

<script setup lang="ts">
import BigIconButton from '@/components/buttons/BigIconButton.vue';

</script>

<style>
#sessions-wrapper {
	display: flex;
	flex-direction: row;
	justify-content: space-evenly;
}

@media screen and (max-width: 740px) {
	#sessions-wrapper {
		flex-direction: column;
	}
	.sessions-link > span {
		font-size: 1.5em;
	}
}
</style>