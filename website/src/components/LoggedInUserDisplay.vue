<template>
	<navigation-button class="user-information" @click="logout">
		<p v-if="!authenticationHandler.isLoggedIn()">Currently not logged in</p>
		<template v-else>
			<p class="name">{{authenticationHandler.userInformation.name}}</p>
			<p class="logout">Logout</p>
			<img class="image" v-if="authenticationHandler.userInformation.avatar" :src="authenticationHandler.userInformation.avatar"/>
		</template>
	</navigation-button>
</template>

<script setup lang="ts">
import AuthenticationHandler from '@/authentication-handler';
import useDependency from '@/composables/use-dependency';
import NavigationButton from './buttons/NavigationButton.vue';

const authenticationHandler = useDependency(AuthenticationHandler);

function logout() {
	authenticationHandler.logout();
}
</script>

<style scoped>

.user-information {
	display: flex;
	align-items: center;
}

.name, .logout {
	margin-right: 0.5em;
}

.user-information:hover>.name {
	display: none;
}

.user-information:not(:hover)>.logout {
	display: none;
}

.logout {
	display: inline;
}

.image {
	width: 2em;
	height: 2em;
	border-radius: 100%;
}

</style>