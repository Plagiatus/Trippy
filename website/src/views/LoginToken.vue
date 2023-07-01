<template>
	<div class="token-login-view">
		<loading-spinner v-if="!data.loggingInAs"/>
		<template v-else>
			<img class="avatar" v-if="data.loggingInAs.avatar" :src="data.loggingInAs.avatar"/>
			<p class="text">You are about to login as <span class="username">{{data.loggingInAs.name}}</span></p>
			<div class="buttons-collection">
				<normal-button @click="cancelLogin">Cancel</normal-button>
				<loading-button @click="login" :loading="data.isLoggingIn" text="Login"/>
			</div>
		</template>
	</div>
</template>

<script setup lang="ts">
import LoadingSpinner from '@/components/LoadingSpinner.vue';
import useProvidedItem from '@/composables/use-provided-item';
import AuthenticationHandler from '@/authentication-handler';
import { computed, onMounted, shallowReactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import utils from '@/utils/utils';
import AuthenticationApiClient from '@/api-clients/authentication-api-client';
import LoadingButton from '@/components/LoadingButton.vue';
import NormalButton from '@/components/NormalButton.vue';

const data = shallowReactive({
	loggingInAs: null as {name: string, avatar: string|null}|null,
	isLoggingIn: false,
});

const authenticationHandler = useProvidedItem(AuthenticationHandler);
const authenticationApiClient = useProvidedItem(AuthenticationApiClient);
const router = useRouter();
const route = useRoute();

const urlParams = computed(() => {
	const redirectUrl = route.query["redirect"];
	if (Array.isArray(redirectUrl) || !redirectUrl) {
		return null;
	}
	
	const token = route.query["token"];
	if (Array.isArray(token) || !token) {
		return null;
	}

	const tokenBody = utils.getJwtBody(token);
	if (!tokenBody || typeof tokenBody !== "object" || !("userId" in tokenBody)) {
		return null;
	}

	return {redirectUrl, token, userId: tokenBody.userId + ""};
});

onMounted(async () => {
	if (checkIfTokenShouldBeIgnored()) {
		return;
	}

	if (!urlParams.value) {
		return cancelLogin();
	}

	if (authenticationHandler.isLoggedIn() && authenticationHandler.refreshRequired) {
		await authenticationHandler.getJwt();
		if (authenticationHandler.isLoggedIn() && authenticationHandler.userInformation.userId === urlParams.value.userId) {
			return redirect();
		}
	}

	const informationResponse = await authenticationApiClient.getInformationFromLoginToken(urlParams.value.token);
	if (!informationResponse.data) {
		return cancelLogin();
	}

	data.loggingInAs = informationResponse.data;
});

async function login() {
	if (!urlParams.value) {
		return cancelLogin();
	}

	data.isLoggingIn = true;

	const loggedIn = await authenticationHandler.authenticateUsingLoginToken(urlParams.value.token);
	if (loggedIn) {
		redirect();
	} else {
		cancelLogin();
	}
}

function cancelLogin() {
	return router.push({name: "Home"});
}

function redirect() {
	if (!urlParams.value) {
		return router.push({name: "Home"});
	}

	const toUrl = new URL(urlParams.value.redirectUrl);
	const atHost = new URL(location.href).host;

	if (atHost !== toUrl.host) {
		return router.push({name: "Home"});
	}

	router.push({ path: toUrl.pathname, hash: toUrl.hash, query: searchParamsToRecord(toUrl.searchParams) });
}

function searchParamsToRecord(searchParams: URLSearchParams) {
	const record: Record<string,string> = {};
	searchParams.forEach((value, key) => record[key] = value);
	return record;
}

function checkIfTokenShouldBeIgnored() {
	if (!authenticationHandler.isLoggedIn() || authenticationHandler.refreshRequired || !urlParams.value) {
		return false;
	}

	if (authenticationHandler.userInformation.userId === urlParams.value.userId) {
		redirect();
		return true;
	}
	return false;
}
</script>

<style scoped>

.token-login-view {
	display: flex;
	flex-flow: column;
	justify-content: center;
	align-items: center;
	height: 100%;
}

</style>