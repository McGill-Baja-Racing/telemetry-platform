<script setup lang="ts">
import { inject } from "vue";
import { fieldId } from "./field.ts";

/**
 * A text input, with an optional icon in the default slot. Give it a `label` when no UiFormRow
 * names it.
 */
const { label, placeholder, type = "text" } = defineProps<{
  label?: string;
  placeholder?: string;
  type?: "text" | "search" | "number" | "email" | "password";
}>();
const model = defineModel<string>({ default: "" });
const id = inject(fieldId, undefined);
</script>

<template>
  <div
    class="flex h-8 min-w-0 items-center gap-2 rounded-md bg-hover px-2.75 text-faint has-focus-visible:outline-2 has-focus-visible:outline-info pointer-coarse:h-11"
  >
    <slot />
    <input
      :id
      v-model="model"
      :type
      :placeholder
      :aria-label="label"
      class="w-full min-w-0 bg-transparent text-fg outline-none placeholder:text-faint pointer-coarse:text-lg"
    />
  </div>
</template>
