<template>
	<content-box header="Join Information">
		<input-select v-model="sessionBlueprint.edition" :values="editionOptions" name="Edition" class="input-row" required/>

		<transition-size>
			<input-select v-if="sessionBlueprint.edition === 'java'" v-model="sessionBlueprint.version" :values="data.javaVersions" name="Version" class="input-row" required/>
			<input-field v-else-if="sessionBlueprint.edition === 'other'" v-model="sessionBlueprint.name" type="text" name="Version" class="input-row" required/>
		</transition-size>

		<input-select v-model="selectedServerType" :values="serverTypeOptions" name="Server Type" class="input-row" required/>

		<transition-size>
			<input-field
				v-if="selectedServerType === 'server'"
				v-model="selectedServerValue"
				type="text"
				name="Ip"
				placeholder="xxx.xxx.xxx.xxx:XXXXX | server.domain.com"
				class="input-row"
				required
				pattern="((^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,8})|(((^|\.)((25[0-5])|(2[0-4]\d)|(1\d\d)|([1-9]?\d))){4}))(:((6553[0-5])|(655[0-2][0-9])|(65[0-4][0-9]{2})|(6[0-4][0-9]{3})|([1-5][0-9]{4})|([0-5]{0,5})|([0-9]{1,4})))?$"
			/>
			<input-field v-else-if="selectedServerType === 'realms'" v-model="selectedRealmValue" type="text" name="Realms owner IGN" placeholder="Defaults to you" class="input-row"/>
		</transition-size>

		<input-field v-model="rpLinkValue" type="text" name="Resource Pack" placeholder="www.example.com/download" class="input-row" pattern="^(.+:\/\/)?([^.]+\.)+[^.]+(\/.)?"/>
	</content-box>
</template>

<script setup lang="ts">
import InputField from '@/components/inputs/InputField.vue';
import InputSelect from '@/components/inputs/InputSelect.vue';
import { PartialSessionBlueprint, SessionBlueprint } from '@/types/session-blueprint-types';
import { computed, onMounted, shallowReactive, watchEffect } from 'vue';
import useProvidedItem from '@/composables/use-provided-item';
import MojangApiClient from '@/api-clients/mojang-api-client';
import ContentBox from '../ContentBox.vue';
import TransitionSize from '../TransitionSize.vue';
import { InputSelectedGroupedValuesType, InputSelectValueType } from '@/types/types';

const props = defineProps<{
	sessionBlueprint: PartialSessionBlueprint;
}>()

const data = shallowReactive({
	javaVersions: [] as ReadonlyArray<InputSelectedGroupedValuesType<string>>,
});

const selectedServerType = computed({
	get() {
		return props.sessionBlueprint.server?.type;
	},
	set(value) {
		switch(value) {
			case undefined:
				props.sessionBlueprint.server = undefined;
				break;
			case "realms":
				selectedRealmValue.value = "";
				break;
			case "server":
				selectedServerValue.value = "";
				break;
		}
	}
})

const mojangApiClient = useProvidedItem(MojangApiClient);

const editionOptions: InputSelectValueType<SessionBlueprint["edition"]>[] = [
	{value: "java", name: "Java"},
	{value: "bedrock", name: "Bedrock"},
	{value: "other", name: "Other"},
]

const serverTypeOptions: InputSelectValueType<"realms"|"server">[] = [
	{value: "server", name: "Server"},
	{value: "realms", name: "Realm"},
];

const selectedRealmValue = computed({
	get() {
		if (props.sessionBlueprint.server?.type === "realms") {
			return props.sessionBlueprint.server.owner;
		}
		return undefined;
	},
	set(owner) {
		props.sessionBlueprint.server = {
			type: "realms",
			owner: owner,
		}
	}
});

const selectedServerValue = computed({
	get() {
		if (props.sessionBlueprint.server?.type === "server") {
			return props.sessionBlueprint.server.ip;
		}
		return undefined;
	},
	set(ip) {
		props.sessionBlueprint.server = {
			type: "server",
			ip: ip ?? "",
		}
	}
});

const rpLinkValue = computed({
	get() {
		return props.sessionBlueprint.rpLink;
	},
	set(value) {
		if (value) {
			props.sessionBlueprint.rpLink = value;
		} else {
			props.sessionBlueprint.rpLink = undefined;
		}
	}
})

onMounted(async () => {
	const versions = await mojangApiClient.getJavaVersions();
	data.javaVersions = versions.map(versionGroup => ({
		name: versionGroup.label,
		values: versionGroup.versions.map(version => ({
			name: version,
			value: version,
		}))
	}))
});
</script>

<style scoped>
.input-row:not(:last-child) {
	margin-bottom: 1em;
}
</style>