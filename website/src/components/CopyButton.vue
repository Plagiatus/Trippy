<template>
    <button type="button" class="btn copy-btn" @click="copyData">
        <img class="copy-icon" src="@/assets/copy.svg" alt="Copy">
        <span class="copy-confirmation" v-if="textVisible">copied</span>
    </button>
</template>

<script lang="ts">
    import { defineComponent } from "vue";
    
    export default defineComponent({
        name: "CopyButton",
        props: ["value"],
        data() {
            return {
                textVisible: false,
                textHideTimeout: null as unknown as number,
            }
        },
        methods: {
            copyData(){
                navigator.clipboard.writeText(this.value);
                if(this.textHideTimeout) clearTimeout(this.textHideTimeout);
                this.textVisible = true;
                this.textHideTimeout = setTimeout(()=>{this.textVisible = false}, 1000);
            }
        }

    });
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