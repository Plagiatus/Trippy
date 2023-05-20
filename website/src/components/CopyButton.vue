<template>
    <button type="button" class="btn copy-btn" @click="copyData">
        <img class="copy-icon" src="/icons/copy.svg" alt="Copy">
        <span class="copy-confirmation" v-if="data.textVisible">copied</span>
    </button>
</template>

<script setup lang="ts">
import { shallowReactive } from "vue";

const props = defineProps<{
    value: string
}>();

const data = shallowReactive({
    textHideTimeout: null as null|number,
    textVisible: false,
})

function copyData() {
    navigator.clipboard.writeText(props.value);
    if (data.textHideTimeout) {
        clearTimeout(data.textHideTimeout);
    }
    data.textVisible = true;
    data.textHideTimeout = setTimeout(() => {
        data.textVisible = false;
    }, 1000);
}
</script>

<style>
button.copy-btn {
    padding-left: 0.5em;
    padding-right: 0.5em;
}

.copy-icon {
	width: 1em;
	height: 1em;
	filter: var(--text-color-filter);
	position: relative;
}

.copy-confirmation {
	position: absolute;
	top: 0;
	left: 2.5em;
	border: 1px solid var(--text-color);
	padding: 0.2em;
	border-radius: 0.2em;
}
</style>