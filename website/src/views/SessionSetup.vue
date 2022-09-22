<template>
	<div>
		<form @submit="loadCode" id="load-code-form">
			<label for="loadingCode">Setup Code (this will overwrite your inputs so far!)</label>
			<input type="text" v-model="loadingCode" id="loadingCode" maxlength="5" size="5" pattern="^[a-zA-Z0-9]{5}$">
			<span class="error-display" v-if="loadCodeError">{{ loadCodeError }}</span>
			<loading-button :text="'Go'" :loading="loadingCodeLoading" :type="'submit'" :success-text="'Ok'">
			</loading-button>
		</form>
		<form @submit="submitSession">
			<h2>Info</h2>
			<label for="sessionType">Type</label>
			<select name="sessionType" id="sessionType" v-model="session.type" required>
				<option value="test">Testing for bugs / feedback</option>
				<option value="record">Recording for trailer/screenshots</option>
				<option value="fun">Playing for fun</option>
				<option value="stream">Streaming maptesting/-making</option>
			</select>

			<label for="edition">Edition</label>
			<select name="edition" id="edition" v-model="session.edition" required>
				<option value="java">Java</option>
				<option value="bedrock">Bedrock</option>
				<option value="other">Other</option>
			</select>
			<div :class="{hidden: session.edition != 'java'}">
				<label for="version-java">Version</label>
				<select name="version" id="version-java" v-model="session.version" required>
					<optgroup v-for="group in javaVersions" :label="group.label">
						<option v-for="ver in group.versions" :key="ver" :value="ver">{{ver}}</option>
					</optgroup>
				</select>
			</div>
			<div :class="{hidden: session.edition != 'other'}">
				<label for="version-other">Version</label>
				<input type="text" name="version" id="version-other" v-model="session.version" required>
			</div>

			<label for="rp">Resourcepack</label>
			<input type="text" name="rp" id="rp" v-model="session.rpLink">

			<label for="ip">IP</label>
			<input type="text" name="ip" id="ip" v-model="session.ip" required
				pattern="((^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,8})|(((^|\.)((25[0-5])|(2[0-4]\d)|(1\d\d)|([1-9]?\d))){4}))(:((6553[0-5])|(655[0-2][0-9])|(65[0-4][0-9]{2})|(6[0-4][0-9]{3})|([1-5][0-9]{4})|([0-5]{0,5})|([0-9]{1,4})))?$">

			<label for="playerAmt">Playerslots</label>
			<input type="number" name="playerAmt" id="playerAmt" v-model="session.playerAmt" min="0" required>

			<label for="vcAmt">Voice Chats</label>
			<input type="number" name="vcAmt" id="vcAmt" v-model="session.vcAmount" min="0" required>

			<h2>Presentation</h2>

			<label for="mapName">Map Name</label>
			<input type="text" name="mapName" id="mapName" v-model="session.name" required>

			<label for="mapImage">Map Image</label>
			<input type="text" name="mapImage" id="mapImage" v-model="session.image">
			<img id="map-image-preview" :src="session.image" alt="">

			<label for="gamemode">Gamemode</label>
			<select name="gamemode" id="gamemode" v-model="session.mode" required>
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
			<textarea name="mapDescription" id="mapDescription" v-model="session.description"></textarea>

			<h3>Communication</h3>
			<label for="comPrefNone">No Preference</label>
			<input type="radio" name="comPref" id="comPrefNone" value="none"
				v-model="session.preferences.communication">
			<label for="comPrefEnc">Voicechat encouraged</label>
			<input type="radio" name="comPref" id="comPrefEnc" value="vc_encouraged"
				v-model="session.preferences.communication">
			<label for="comPrefReq">Voicechat required</label>
			<input type="radio" name="comPref" id="comPrefReq" value="vc_required"
				v-model="session.preferences.communication">

			<h3>Map experience</h3>
			<label for="playerPrefNone">No preference</label>
			<input type="radio" name="playerPref" id="playerPrefNone" value="none"
				v-model="session.preferences.newPlayers">
			<label for="playerPrefNew">New players only</label>
			<input type="radio" name="playerPref" id="playerPrefNew" value="new"
				v-model="session.preferences.newPlayers">
			<label for="playerPref">Returning players only</label>
			<input type="radio" name="playerPref" id="playerPref" value="exp" v-model="session.preferences.newPlayers">

			<label for="timeEstimate">How much time do you expect this will take?</label>
			<input type="number" name="timeEstimate" id="timeEstimate" min="0"
				v-model="session.preferences.timeEstimate">


			<label for="testDescription">Test Description</label>
			<textarea name="testDescription" id="testDescription" v-model="session.testDescription"></textarea>

			<h2>Feedback</h2>
			<span>Coming soon</span>

			<loading-button :text="'Get Code'" :success-text="'Got Code'" :loading="loadingSessionCode"
				:type="'submit'"></loading-button>
			<output id="code-output">{{sessionCode}}</output>
			<copy-button :value="sessionCode"></copy-button>
			<span class="error-display" v-if="sendSessionError">{{ sendSessionError }}</span>
		</form>
	</div>
</template>


<script lang="ts">
import request from "@/mixins/request";
import formutils from "@/mixins/form-utils";
import { defineComponent } from "vue";
import CopyButton from "@/components/CopyButton.vue";
import LoadingButton from "@/components/LoadingButton.vue";

export default defineComponent({
	components: { CopyButton, LoadingButton },
	mixins: [request, formutils],
	data() {
		return {
			session: {} as SessionSetupData,
			loadingCode: "asdfa",
			loadingCodeLoading: false,
			loadCodeError: "",
			javaVersions: [] as JavaVersion[],
			sessionCode: "",
			sendSessionError: "",
			loadingSessionCode: false,
		}
	},
	methods: {
		async loadCode(e: Event) {
			this.prevent(e);
			if (this.loadingCodeLoading) return;
			this.loadCodeError = "";
			if (this.loadingCode.trim().length == 0) {
				this.loadCodeError = "Code cannot be empty.";
				return;
			}
			this.loadingCodeLoading = true;
			let reply = await this.sendRequest("session/setup/" + this.loadingCode, "GET");
			if (reply.error) {
				if (reply.error.statusText)
					this.loadCodeError = reply.error.statusText;
				else
					this.loadCodeError = reply.error;
				this.loadingCodeLoading = false;
				return;
			}
			try {
				if (reply.data) {
					this.session = JSON.parse(reply.data);
					this.loadingCodeLoading = false;
					return;
				}
				this.loadCodeError = "The server sent an empty response.";
			} catch (error: any) {
				this.loadCodeError = error;
			}
			this.loadingCodeLoading = false;

		},
		prevent(e: Event) {
			e.preventDefault();
		},
		async loadJavaVersions() {
			let oldest = 7;
			let reply = await (await fetch("https://launchermeta.mojang.com/mc/game/version_manifest.json")).json();
			if (reply.versions) {
				this.javaVersions = [];
				let prevMajor = "";
				let javaVersion: JavaVersion = { label: "", versions: [] };
				for (let i: number = 0; i < reply.versions.length; i++) {
					if (reply.versions[i].type == "release") {
						let id = reply.versions[i].id;
						let v = id.split(".");
						if (+v[1] < oldest) break;
						if (v[1] != prevMajor) {
							javaVersion = { label: `${v[0]}.${v[1]}`, versions: [] };
							prevMajor = v[1];
							this.javaVersions.push(javaVersion);
						}
						javaVersion.versions.push(id);
					}
				}

			}
		},
		async submitSession(e: Event) {
			this.prevent(e);
			if (this.loadingSessionCode) return;
			this.loadingSessionCode = true;
			let reply = await this.sendRequest("session/getcode/", "POST", this.session);
			if (reply.error) {
				if (reply.error.statusText)
					this.sendSessionError = reply.error.statusText;
				else
					this.sendSessionError = reply.error;
				this.loadingSessionCode = false;
				return;
			}
			try {
				if (reply.data) {
					let data = JSON.parse(reply.data);
					if(data.code){
						this.sessionCode = data.code;
					}

					this.loadingSessionCode = false;
					return;
				}
				this.sendSessionError = "The server sent an empty response.";
			} catch (error: any) {
				this.sendSessionError = error;
			}
		}
	},
	created() {
		this.session = { description: "", name: "", edition: "", image: "", ip: "", mode: "", playerAmt: 0, preferences: { communication: "none", newPlayers: "none", timeEstimate: 0 }, rpLink: "", type: "", vcAmount: 1, version: "", testDescription: "" }
	},
	mounted() {
		this.loadJavaVersions();
	},

})

interface JavaVersion {
	label: string,
	versions: string[]
}

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