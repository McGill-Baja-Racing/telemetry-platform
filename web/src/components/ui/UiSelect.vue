<script setup lang="ts" generic="T extends string">
import { Check, ChevronDown } from "@lucide/vue";
import {
  SelectContent,
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  SelectPortal,
  SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectViewport,
} from "reka-ui";
import type { Option } from "./types.ts";

/** Picks one value from a list, such as a run or a driver. `label` is shown before the value. */
const { options, label, placeholder } = defineProps<{
  options: Option<T>[];
  label: string;
  placeholder?: string;
}>();
const model = defineModel<T>();
</script>

<template>
  <SelectRoot v-model="model">
    <SelectTrigger
      :aria-label="label"
      class="inline-flex h-8 min-w-0 cursor-pointer items-center gap-2 rounded-md pr-2.25 pl-3 font-medium whitespace-nowrap inset-ring inset-ring-line-strong transition-colors hover:bg-hover pointer-coarse:h-11"
    >
      <span class="font-normal text-faint">{{ label }}</span>
      <SelectValue :placeholder class="flex-1 truncate text-left" />
      <ChevronDown class="size-3.5 text-faint" />
    </SelectTrigger>
    <SelectPortal>
      <SelectContent
        position="popper"
        :side-offset="6"
        class="z-50 max-h-(--reka-select-content-available-height) min-w-(--reka-select-trigger-width) origin-(--reka-select-content-transform-origin) rounded-xl bg-popover p-1.5 shadow-popover data-[state=closed]:animate-pop-out data-[state=open]:animate-pop-in"
      >
        <SelectViewport>
          <SelectItem
            v-for="option in options"
            :key="option.value"
            :value="option.value"
            class="flex h-8 cursor-pointer items-center gap-2.5 rounded-sm px-2.5 outline-none select-none data-highlighted:bg-hover pointer-coarse:h-11"
          >
            <SelectItemText>{{ option.label }}</SelectItemText>
            <SelectItemIndicator class="ml-auto">
              <Check class="size-3.5" />
            </SelectItemIndicator>
          </SelectItem>
        </SelectViewport>
      </SelectContent>
    </SelectPortal>
  </SelectRoot>
</template>
