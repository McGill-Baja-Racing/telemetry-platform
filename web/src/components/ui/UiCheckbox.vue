<script setup lang="ts">
import { Check } from "@lucide/vue";
import { CheckboxIndicator, CheckboxRoot } from "reka-ui";

/** A box to tick, such as a run to compare. `label` is what screen readers say. */
const { label } = defineProps<{ label: string }>();
const model = defineModel<boolean>({ default: false });
</script>

<template>
  <CheckboxRoot
    v-model="model"
    :aria-label="label"
    class="relative grid size-4 flex-none cursor-pointer place-items-center rounded-sm inset-ring-2 inset-ring-line-strong transition before:absolute before:-inset-3 active:scale-97 disabled:cursor-default disabled:opacity-40 data-[state=checked]:bg-ink data-[state=checked]:text-on-ink data-[state=checked]:inset-ring-0 pointer-coarse:before:-inset-3.5"
  >
    <CheckboxIndicator><Check class="size-2.75 stroke-3" /></CheckboxIndicator>
  </CheckboxRoot>
</template>
