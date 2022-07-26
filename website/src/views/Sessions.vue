<template>
	<div>
		<router-link class="sessions-link" :to="{ name: 'Sessions.Setup' }">
			<h2>&rarr; set up a new session</h2>
		</router-link>
	</div>
</template>

<style>
.sessions-link {
	text-decoration: none;
	color: var(--text-color);
}
</style>