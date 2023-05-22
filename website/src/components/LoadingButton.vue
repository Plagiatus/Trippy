<template>
	<button class="btn" :disabled="loading || data.success || disabled"
		:class="{loading: loading, light: light, red: red}"
		:type="type">&nbsp;{{textToDisplay}}</button>
</template>

<script setup lang="ts">
import { computed, shallowReactive, watch } from 'vue';

const props = defineProps<{
	text: string;
	loading?: boolean;
	successText?: string;
	light?: boolean;
	red?: boolean;
	disabled?: boolean;
	type?: "button"|"submit"|"reset";
}>();

const data = shallowReactive({
	success: false,
	successClearTimeout: null as null|number,
});

watch(() => props.loading, () => {
	if (props.loading) {
		return;
	}

	data.successClearTimeout !== null && clearTimeout(data.successClearTimeout);

	data.success = true;
	data.successClearTimeout = setTimeout(() => {
		data.success = false;
	}, 1000);
});

const textToDisplay = computed(() =>{
	if (data.success) return props.successText;
	if (props.loading) return "";
	return props.text;
});
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