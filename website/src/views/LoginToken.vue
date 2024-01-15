<template>
	<div class="token-login-view">
		<loading-spinner v-if="!data.loggingInAs"/>
		<content-box v-else>
			<div class="login-box">
				<div class="spacing"></div>
				<img class="avatar" v-if="data.loggingInAs.avatar" :src="data.loggingInAs.avatar"/>
				<p class="text">You are about to login as <span class="username">{{data.loggingInAs.name}}</span></p>
				<div class="spacing"></div>
				<div class="buttons-collection">
					<normal-button color="highlight" @click="cancelLogin">Cancel</normal-button>
					<loading-button color="highlight" @click="login" :loading="data.isLoggingIn" text="Login"/>
				</div>
			</div>
		</content-box>
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
import LoadingButton from '@/components/buttons/LoadingButton.vue';
import NormalButton from '@/components/buttons/NormalButton.vue';
import ContentBox from '@/components/ContentBox.vue';

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
	justify-content: center;
	align-items: center;
	height: 100%;
}

.login-box {
	display: flex;
	flex-flow: column;
	justify-content: center;
	align-items: center;
	aspect-ratio: 1/1;
	padding: 32px;
}

.spacing {
	flex-grow: 1;
}

.avatar {
	width: 100px;
	height: 100px;
	object-fit: contain;
	border-radius: 4px;
}

.buttons-collection {
	display: flex;
	gap: 32px;
	font-size: 1.1em;
}

.text {
	font-size: 1.1em;
	margin-top: 16px;
	margin-bottom: 8px;
}

.username {
	background-color: var(--background);
	padding: 4px;
	border-radius: 8px;
}
</style>