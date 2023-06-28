<template>
	<div class="authenticated-view">
		<template v-if="!data.failedAuthentication">
			<LoadingSpinner/>
			<p>Logging in...</p>
		</template>
		<p v-else>Failed to authenticate.</p>
	</div>
</template>

<script setup lang="ts">
import LoadingSpinner from '@/components/LoadingSpinner.vue';
import useProvidedItem from '@/composables/use-provided-item';
import AuthenticationHandler from '@/authentication-handler';
import { onMounted, shallowReactive } from 'vue';
import { useRouter } from 'vue-router';

const data = shallowReactive({
	failedAuthentication: false,
});

const authenticationHandler = useProvidedItem(AuthenticationHandler);
const router = useRouter();

onMounted(() => {
	try {
		const result = authenticationHandler.getOAuthResult();
		if (result.oAuthType === "discord") {
			authenticateUsingDiscordCode(result.code);
		} else {
			data.failedAuthentication = true;
		}
	} catch {
		data.failedAuthentication = true;
	}
});

async function authenticateUsingDiscordCode(code: string) {
	if (await authenticationHandler.authenticateUsingDiscordCode(code)) {
		router.push({name: "Sessions"});
	} else {
		data.failedAuthentication = true;
	}
}
</script>

<style scoped>

.authenticated-view {
	display: flex;
	flex-flow: column;
	justify-content: center;
	align-items: center;
	height: 100%;
}

</style>