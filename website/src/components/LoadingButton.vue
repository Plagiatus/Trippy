<template>
	<button class="btn" :disabled="loading || success || disabled"
		:class="{loading: loading, light: light, red: red}"
		:type="type">&nbsp;{{textToDisplay}}</button>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
	name: "LoadingButton",
	props: ["text", "loading", "successText", "light", "red", "disabled", "type"],
	data() {
		return {
			success: false
		}
	},
	watch: {
		loading(newValue, oldValue) {
			if (!newValue) {
				this.success = true;
				setTimeout(() => {
					this.success = false;
				}, 1000)
			}
		}
	},
	computed: {
		textToDisplay(): string {
			if (this.success) return this.successText;
			if (this.loading) return "";
			return this.text;
		}
	}
})
</script>

<style>

@keyframes loading {
  to {transform: rotate(360deg);}
}
 
.loading:before {
  content: '';
  box-sizing: border-box;
  position: absolute;
  top: 50%;
  left: 50%;
  width: 30px;
  height: 30px;
  margin-top: -15px;
  margin-left: -15px;
  border-radius: 50%;
  border: 1px solid #ccc;
  border-top-color: var(--highlight);
  animation: loading .6s linear infinite;
}

.btn.loading:before {
	width: 1em;
	height: 1em;
	margin-top: -.5em;
	margin-left: -.5em;
}
</style>