<script setup lang="ts" generic="T extends string">
import { unrefElement, useResizeObserver } from "@vueuse/core";
import { ToggleGroupItem, ToggleGroupRoot } from "reka-ui";
import { type ComponentPublicInstance, ref, useTemplateRef, watch } from "vue";
import type { Option } from "./types.ts";

/** A choice between a few options, all visible, such as a 10, 30 or 60 s window. */
const { options, label } = defineProps<{ options: readonly Option<T>[]; label: string }>();
const model = defineModel<T>({ required: true });

/** Clicking the selected option again would clear it: keep one selected. */
function select(value: unknown) {
  if (typeof value === "string" && value) model.value = value as T;
}

/** The highlight slides to the selected option. Options differ in width, so it is measured. */
const root = useTemplateRef<ComponentPublicInstance>("root");
const thumb = ref<{ left: number; width: number }>();

function place() {
  const item = unrefElement(root)?.querySelector<HTMLElement>("[data-state=on]");
  thumb.value = item ? { left: item.offsetLeft, width: item.offsetWidth } : undefined;
}

useResizeObserver(root, place);
watch(model, place, { flush: "post" });
</script>

<template>
  <ToggleGroupRoot
    ref="root"
    type="single"
    :model-value="model"
    :aria-label="label"
    class="relative inline-flex rounded-lg bg-hover p-0.5"
    @update:model-value="select"
  >
    <span
      v-if="thumb"
      class="absolute inset-y-0.5 left-0 rounded-md bg-popover shadow-control transition-all duration-200"
      :style="{ width: `${thumb.width}px`, translate: `${thumb.left}px` }"
    />
    <ToggleGroupItem
      v-for="option in options"
      :key="option.value"
      :value="option.value"
      class="relative h-7 cursor-pointer rounded-md px-2.75 text-sm font-medium whitespace-nowrap text-muted transition-colors pointer-coarse:h-9 hover:text-fg data-[state=on]:text-fg"
    >
      {{ option.label }}
    </ToggleGroupItem>
  </ToggleGroupRoot>
</template>
