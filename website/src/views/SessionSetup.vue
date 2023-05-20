<template>
	<div>
		<form @submit.prevent="loadCode" id="load-code-form">
			<label for="loadingCode">Setup Code (this will overwrite your inputs so far!)</label>
			<input type="text" v-model="data.loadingCode" id="loadingCode" maxlength="5" size="5" pattern="^[a-zA-Z0-9]{5}$" v-validateFormat>
			<span class="error-display" v-if="data.loadCodeError">{{ data.loadCodeError }}</span>
			<loading-button :text="'Go'" :loading="data.loadingCodeLoading" :type="'submit'" :success-text="'Ok'">
			</loading-button>
		</form>
		<form @submit.prevent="submitSession">
			<h2>Info</h2>
			<label for="sessionType">Type</label>
			<select name="sessionType" id="sessionType" v-model="session.type" v-requiredWithStar v-validateFormat>
				<option value="test">Testing for bugs / feedback</option>
				<option value="record">Recording for trailer/screenshots</option>
				<option value="fun">Playing for fun</option>
				<option value="stream">Streaming maptesting/-making</option>
			</select>

			<label for="edition">Edition</label>
			<select name="edition" id="edition" v-model="session.edition" v-requiredWithStar v-validateFormat>
				<option value="java">Java</option>
				<option value="bedrock">Bedrock</option>
				<option value="other">Other</option>
			</select>
			<div :class="{hidden: session.edition != 'java'}">
				<label for="version-java">Version</label>
				<select name="version" id="version-java" v-model="session.version" v-requiredWithStar v-validateFormat>
					<optgroup v-for="group in data.javaVersions" :label="group.label">
						<option v-for="ver in group.versions" :key="ver" :value="ver">{{ver}}</option>
					</optgroup>
				</select>
			</div>
			<div :class="{hidden: session.edition != 'other'}">
				<label for="version-other">Version</label>
				<input type="text" name="version" id="version-other" v-model="session.version" v-requiredWithStar v-validateFormat>
			</div>

			<label for="rp">Resourcepack</label>
			<input type="text" name="rp" id="rp" v-model="session.rpLink" v-validateFormat>

			<label for="ip">IP</label>
			<input type="text" name="ip" id="ip" v-model="session.ip" v-requiredWithStar v-validateFormat
				pattern="((^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,8})|(((^|\.)((25[0-5])|(2[0-4]\d)|(1\d\d)|([1-9]?\d))){4}))(:((6553[0-5])|(655[0-2][0-9])|(65[0-4][0-9]{2})|(6[0-4][0-9]{3})|([1-5][0-9]{4})|([0-5]{0,5})|([0-9]{1,4})))?$">

			<label for="playerAmt">Playerslots</label>
			<input type="number" name="playerAmt" id="playerAmt" v-model="session.playerAmt" min="0" v-requiredWithStar v-validateFormat>

			<label for="vcAmt">Voice Chats</label>
			<input type="number" name="vcAmt" id="vcAmt" v-model="session.vcAmount" min="0" v-requiredWithStar v-validateFormat>

			<h2>Presentation</h2>

			<label for="mapName">Map Name</label>
			<input type="text" name="mapName" id="mapName" v-model="session.name" v-requiredWithStar v-validateFormat>

			<label for="mapImage">Map Image</label>
			<input type="text" name="mapImage" id="mapImage" v-model="session.image" v-validateFormat>
			<img id="map-image-preview" :src="session.image" alt="">

			<label for="gamemode">Gamemode</label>
			<select name="gamemode" id="gamemode" v-model="session.mode" v-requiredWithStar v-validateFormat>
				<option value="parkour">Parkour</option>
				<option value="pvp">PvP</option>
				<option value="pve">PvE</option>
				<option value="puzzle">Puzzle</option>
				<option value="strategy">Strategy</option>
				<option value="hns">Hide and Seek</option>
				<option value="ctm">CTM</option>
				<option value="multiple">Multiple</option>
				<option value="other">Other</option>
			</select>

			<label for="mapDescription">Map Description</label>
			<textarea name="mapDescription" id="mapDescription" v-model="session.description"  v-validateFormat></textarea>

			<h3>Communication</h3>
			<label for="comPrefNone">No Preference</label>
			<input type="radio" name="comPref" id="comPrefNone" value="none" v-validateFormat
				v-model="session.preferences.communication">
			<label for="comPrefEnc">Voicechat encouraged</label>
			<input type="radio" name="comPref" id="comPrefEnc" value="vc_encouraged" v-validateFormat
				v-model="session.preferences.communication">
			<label for="comPrefReq">Voicechat required</label>
			<input type="radio" name="comPref" id="comPrefReq" value="vc_required" v-validateFormat
				v-model="session.preferences.communication">

			<h3>Map experience</h3>
			<label for="playerPrefNone">No preference</label>
			<input type="radio" name="playerPref" id="playerPrefNone" value="none" v-validateFormat
				v-model="session.preferences.newPlayers">
			<label for="playerPrefNew">New players only</label>
			<input type="radio" name="playerPref" id="playerPrefNew" value="new" v-validateFormat
				v-model="session.preferences.newPlayers">
			<label for="playerPref">Returning players only</label>
			<input type="radio" name="playerPref" id="playerPref" value="exp" v-model="session.preferences.newPlayers" v-validateFormat>

			<label for="timeEstimate">How much time do you expect this will take?</label>
			<input type="number" name="timeEstimate" id="timeEstimate" min="0" v-validateFormat
				v-model="session.preferences.timeEstimate">


			<label for="testDescription">Test Description</label>
			<textarea name="testDescription" id="testDescription" v-model="session.testDescription" v-validateFormat></textarea>

			<h2>Feedback</h2>
			<span>Coming soon</span>

			<loading-button :text="'Get Code'" :success-text="'Got Code'" :loading="data.loadingSessionCode"
				:type="'submit'"></loading-button>
			<output id="code-output">{{data.sessionCode}}</output>
			<copy-button :value="data.sessionCode"></copy-button>
			<span class="error-display" v-if="data.sendSessionError">{{ data.sendSessionError }}</span>
		</form>
	</div>
</template>

<script setup lang="ts">
import { onMounted, ref, shallowReactive } from "vue";
import CopyButton from "@/components/CopyButton.vue";
import LoadingButton from "@/components/LoadingButton.vue";
import useProvidedItem from "@/composables/use-provided-item";
import SessionsApiClient from "@/api-clients/sessions-api-client";
import MojangApiClient from "@/api-clients/mojang-api-client";
import vRequiredWithStar from "@/directives/v-required-star";
import vValidateFormat from "@/directives/v-validate-format";

const sessionApiClient = useProvidedItem(SessionsApiClient);
const mojangApiClient = useProvidedItem(MojangApiClient);

const data = shallowReactive({
	loadingCode: "asdfa",
	loadingCodeLoading: false,
	loadCodeError: "",
	javaVersions: [] as JavaVersion[],
	sessionCode: "",
	sendSessionError: "",
	loadingSessionCode: false,
});
const session = ref<SessionSetupData>({
	description: "",
	edition: "",
	image: "",
	ip: "",
	mode: "",
	name: "",
	playerAmt: 0,
	preferences: {
		communication: "none",
		newPlayers: "none",
		timeEstimate: 0,
	},
	rpLink: "",
	testDescription: "",
	type: "",
	vcAmount: 0,
	version: "",
});

async function loadCode() {
	if (data.loadingCodeLoading) return;
	data.loadCodeError = "";
	if (data.loadingCode.trim().length == 0) {
		data.loadCodeError = "Code cannot be empty.";
		return;
	}
	data.loadingCodeLoading = true;
	let reply = await sessionApiClient.getTemplate(data.loadingCode);
	if (reply.error) {
		if (typeof reply.error === "object" && "statusText" in reply.error && typeof reply.error.statusText === "string")
			data.loadCodeError = reply.error.statusText;
		else
			data.loadCodeError = reply.error + "";
		data.loadingCodeLoading = false;
		return;
	}
	try {
		if (reply.data) {
			session.value = JSON.parse(reply.data);
			data.loadingCodeLoading = false;
			return;
		}
		data.loadCodeError = "The server sent an empty response.";
	} catch (error) {
		data.loadCodeError = error + "";
	}
	data.loadingCodeLoading = false;
}

async function submitSession() {
	if (data.loadingSessionCode) return;
	data.loadingSessionCode = true;
	let reply = await sessionApiClient.createTemplateCode(session.value);
	if (reply.error) {
		if (typeof reply.error === "object" && "statusText" in reply.error && typeof reply.error.statusText === "string")
			data.sendSessionError = reply.error.statusText;
		else
			data.sendSessionError = reply.error + "";
		data.loadingSessionCode = false;
		return;
	}
	try {
		if (reply.data) {
			let responseData = JSON.parse(reply.data);
			if(responseData.code){
				data.sessionCode = responseData.code;
			}

			data.loadingSessionCode = false;
			return;
		}
		data.sendSessionError = "The server sent an empty response.";
	} catch (error) {
		data.sendSessionError = error + "";
	}
}

onMounted(async () => {
	data.javaVersions = await mojangApiClient.getJavaVersions();
});
</script>

<style>
#map-image-preview {
	max-width: 200px;
	max-height: 200px;
}

#code-output {
	width: 4em;
	height: 1.5em;
	display: inline-block;
	border: 1px solid var(--text-color);
	border-radius: .25em;
	font-family: 'Courier New', Courier, monospace;
}
</style>