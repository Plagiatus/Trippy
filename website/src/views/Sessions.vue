<template>
	<div id="sessions-wrapper">
		<router-link class="sessions-link" :to="{ name: 'Sessions.Setup' }">
			<img src="@/assets/add.svg" alt="New Session">
			<span>Set up a new session</span>
		</router-link>
		<router-link class="sessions-link" :to="{ name: 'Sessions.Feedback' }">
			<img src="@/assets/user-feedback.svg" alt="Show feedback">
			<span>View feedback</span>
		</router-link>
	</div>
</template>

<style>
.sessions-link {
	text-decoration: none;
	color: var(--text-color);
	margin: 2rem;
	display: flex;
	flex-direction: column;
	align-items: center;
}

.sessions-link > img {
	filter: var(--text-color-filter);
	width: 100%;
	width: 200px;
}

.sessions-link > span {
	font-size: 2em;
	font-weight: bold;
}

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