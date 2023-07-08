<template>
	<slot></slot>
</template>

<script setup lang="ts">
import { validateableFormInjectionKey } from '@/injection-keys';
import ValidateableForm from '@/validateable-form';
import { provide } from 'vue';

const props = defineProps<{
	form: ValidateableForm;
}>()

provide(validateableFormInjectionKey, props.form);
</script>