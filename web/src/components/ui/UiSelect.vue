<script setup lang="ts" generic="T extends string">
import { Check } from "@lucide/vue";
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
import UiPickerButton from "./UiPickerButton.vue";

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
    <SelectTrigger as-child :aria-label="label">
      <UiPickerButton :label>
        <SelectValue :placeholder class="flex-1 truncate text-left data-placeholder:font-normal data-placeholder:text-faint" />
      </UiPickerButton>
    </SelectTrigger>
    <SelectPortal>
      <SelectContent
        position="popper"
        :side-offset="6"
        class="popover max-h-(--reka-select-content-available-height) min-w-(--reka-select-trigger-width) origin-(--reka-select-content-transform-origin) p-1.5"
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
