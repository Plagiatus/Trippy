<template>
	<div>
		<button
			type="button"
			class="discord-user"
			ref="buttonRef"
			@click="toggleMenu"
			:aria-expanded="isMenuOpen"
			aria-haspopup="menu"
		>
			<template v-if="user && user.avatar && user.name">
				<img :src="user.avatar" class="image"/>
				<p class="username">{{user.name}}</p>
			</template>
			<template v-else>
				<div class="image"></div>
				<p class="username unknown">Unknown user</p>
			</template>
		</button>
		<div
			v-if="isMenuOpen"
			ref="menuRef"
			class="menu"
			:style="floatingStyles"
			role="menu"
		>
			<p class="no-options" v-if="!menuOptions.length">No options.</p>
			<button
				v-for="option in menuOptions"
				:key="option.title"
				type="button"
				class="menu-option"
				role="menuitem"
				@click="handleOptionClick(option)"
			>
				{{ option.title }}
			</button>
		</div>
	</div>
</template>

<script setup lang="ts">
import { DiscordUserInformationDto, UserRecommendationResultDto } from '$/types/dto-types';
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue';
import { flip, offset, useFloating } from '@floating-ui/vue';
import useDependency from '@/composables/use-dependency';
import AuthenticationHandler from '@/authentication-handler';
import PopupContainer from '@/popup-container';
import RecommendationApiClient from '@/api-clients/recommendation-api-client';
import BanApiClient from '@/api-clients/ban-api-client';
import TimeHelper from '@/time-helper';

export type DiscordUserMenuOption = {
	title: string;
	onClick: () => void;
}

const props = defineProps<{
	user: DiscordUserInformationDto|undefined|null;
	extraOptions?: ReadonlyArray<DiscordUserMenuOption>;
	displayBanOption?: boolean;
}>();

const buttonRef = ref<HTMLElement | null>(null);
const menuRef = ref<HTMLElement | null>(null);
const isMenuOpen = ref(false);

const timeHelper = useDependency(TimeHelper);
const authenticationHandler = useDependency(AuthenticationHandler);
const recommendationApiClient = useDependency(RecommendationApiClient);
const banApiClient = useDependency(BanApiClient);
const popupContainer = useDependency(PopupContainer);

const formatRecommendationResult = (result: UserRecommendationResultDto, userName: string) => {
	if (result.success) {
		return `You have recommended ${userName}.`;
	}

	switch (result.error) {
		case "cooldown":
			if (result.millisecondsBeforeBeingAbleToRecommendAny !== null) {
				const waitTime = Math.max(result.millisecondsBeforeBeingAbleToRecommendUser, result.millisecondsBeforeBeingAbleToRecommendAny ?? 0);
				return `You can first recommend ${userName} or anyone else again in ${timeHelper.formatTime(waitTime)}.`;
			}
			return `You can first recommend ${userName} again in ${timeHelper.formatTime(result.millisecondsBeforeBeingAbleToRecommendUser)}.`;
		case "notAllowed":
			return `You are not yet allowed to recommend ${userName} or anyone else.`;
		case "self":
			return `You can't recommend yourself.`;
		case "userNotFound":
			return `Can't find the user to recommend.`;
		default:
			return `Unable to recommend ${userName}.`;
	}
};

const recommendUser = async (user: DiscordUserInformationDto) => {
	const response = await recommendationApiClient.recommendUser(user.id);
	if (response.error || !response.data) {
		popupContainer.displayMessagePopup({
			header: "Recommendation failed",
			body: "Unable to recommend the selected user.",
		});
		return;
	}

	popupContainer.displayMessagePopup({
		header: response.data.success ? "Recommended" : "Recommendation failed",
		body: formatRecommendationResult(response.data, user.name ?? "the user"),
	});
};

const banUser = async (user: DiscordUserInformationDto) => {
	const response = await banApiClient.banUser(user.id);
	if (response.error || !response.data) {
		popupContainer.displayMessagePopup({
			header: "Ban failed",
			body: "Unable to ban the selected user.",
		});
		return;
	}

	popupContainer.displayMessagePopup({
		header: response.data.success ? "Banned" : "Ban failed",
		body: response.data.success
			? `${user.name ?? "The user"} was banned from your sessions.`
			: response.data.error === "self"
			? "You can't ban yourself."
			: response.data.error === "already-banned"
			? `${user.name ?? "The user"} has already been banned.`
			: "Unable to ban the selected user.",
	});
};

const menuOptions = computed<ReadonlyArray<DiscordUserMenuOption>>(() => {
	const options: DiscordUserMenuOption[] = [];
	const user = props.user;
	
	if (user && authenticationHandler.userInformation && authenticationHandler.userInformation.userId !== user.id) {
		options.push({
			title: "Recommend",
			onClick: async () => await recommendUser(user),
		});

		if (props.displayBanOption) {
			options.push({
				title: "Ban",
				onClick: async () => {
					const result = await popupContainer.displayYesNoDialog({
						header: `Ban ${user.name}`,
						body: `Are you sure you want to ban ${user.name} from entering your sessions?`,
					}).promise;

					if (!result) {
						return;
					}

					await banUser(user);
				},
			});
		}
	}

	if (props.extraOptions) {
		options.push(...props.extraOptions);
	}

	return options;
});

const { floatingStyles, update } = useFloating(buttonRef, menuRef, {
	placement: 'bottom-start',
	strategy: 'fixed',
	middleware: [offset(2), flip()],
});

function toggleMenu() {
	isMenuOpen.value = !isMenuOpen.value;
	if (isMenuOpen.value) {
		nextTick(() => update());
	}
}

function handleOptionClick(option: DiscordUserMenuOption) {
	isMenuOpen.value = false;
	option.onClick();
}

function handleDocumentClick(event: MouseEvent) {
	const target = event.target;
	if (!(target instanceof Node)) {
		return;
	}

	if (!buttonRef.value?.contains(target) && !menuRef.value?.contains(target)) {
		isMenuOpen.value = false;
	}
}

onMounted(() => {
	document.addEventListener('click', handleDocumentClick);
});

onUnmounted(() => {
	document.removeEventListener('click', handleDocumentClick);
});
</script>

<style scoped>
.discord-user {
	display: flex;
	align-items: center;
	gap: 0.5em;
	cursor: pointer;
}

.image {
	width: 2em;
	height: 2em;
	border-radius: 100%;
}

.username.unknown {
	font-style: italic;
}

.menu {
	display: flex;
	flex-direction: column;
	min-width: 8rem;
	padding: 0.25rem;
	border: 1px solid var(--background);
	border-radius: 0.25rem;
	background-color: var(--background);
	color: var(--text-color);
	box-shadow: 0 0.25rem 0.75rem rgba(0, 0, 0, 0.15);
	z-index: 1;
}

.menu-option {
	padding: 0.5rem 0.75rem;
	text-align: left;
	border-radius: 0.25rem;
	cursor: pointer;
}

.menu-option:hover {
	background-color: var(--highlight);
}

.no-options {
	font-style: italic;
}
</style>