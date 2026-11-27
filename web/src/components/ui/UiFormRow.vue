<script setup lang="ts">
import { provide, useId } from "vue";
import { fieldId } from "./field.ts";

/** A label, the field in the default slot, and one line of help. Clicking the label focuses the field. */
const { label, help } = defineProps<{ label: string; help?: string }>();

const id = useId();
provide(fieldId, id);
</script>

<template>
  <div class="grid grid-cols-1 gap-1.5">
    <label :for="id" class="text-sm font-medium text-muted">{{ label }}</label>
    <slot />
    <span v-if="help" class="text-sm text-faint">{{ help }}</span>
  </div>
</template>
