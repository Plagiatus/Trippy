<template>
	<button class="user-information" @click="logout">
		<p v-if="!authenticationHandler.isLoggedIn()">Currently not logged in</p>
		<template v-else>
			<p class="name">{{authenticationHandler.userInformation.name}}</p>
			<p class="logout">Logout</p>
			<img class="image" v-if="authenticationHandler.userInformation.avatar" :src="authenticationHandler.userInformation.avatar"/>
		</template>
	</button>
</template>

<script setup lang="ts">
import AuthenticationHandler from '@/authentication-handler';
import useProvidedItem from '@/composables/use-provided-item';

const authenticationHandler = useProvidedItem(AuthenticationHandler);

function logout() {
	authenticationHandler.logout();
}
</script>

<style scoped>

.user-information {
	display: flex;
	align-items: center;
	background-color: transparent;
	border: none;
	cursor: pointer;
	border-radius: 0.3em;
	padding: 0.25em;
}

.name, .logout {
	color: var(--text-color);
	margin-right: 0.5em;
}

.user-information:hover {
	background-color: var(--dark);
}

.user-information:hover .name {
	display: none;
}

.user-information:not(:hover) .logout {
	display: none;
}

.user-information:hover .logout {
	display: inline;
}

.image {
	width: 2em;
	height: 2em;
	border-radius: 100%;
}

</style>