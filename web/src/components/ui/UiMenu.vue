<script setup lang="ts">
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuRoot,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "reka-ui";
import type { MenuItem } from "./types.ts";

/** A list of actions that opens from the button in the default slot, such as a chart's options. */
const { items, align = "end" } = defineProps<{ items: MenuItem[]; align?: "start" | "end" }>();
</script>

<template>
  <DropdownMenuRoot>
    <DropdownMenuTrigger as-child>
      <slot />
    </DropdownMenuTrigger>
    <DropdownMenuPortal>
      <DropdownMenuContent
        :align
        :side-offset="6"
        class="z-50 grid min-w-55 origin-(--reka-dropdown-menu-content-transform-origin) rounded-xl bg-popover p-1.5 shadow-popover data-[state=closed]:animate-pop-out data-[state=open]:animate-pop-in"
      >
        <template v-for="(item, index) in items" :key="index">
          <DropdownMenuSeparator v-if="item === 'separator'" class="my-1.25 h-px bg-line" />
          <DropdownMenuItem
            v-else
            class="flex h-8 cursor-pointer items-center gap-2.5 rounded-sm px-2.5 whitespace-nowrap outline-none data-highlighted:bg-hover pointer-coarse:h-11"
            @select="item.select"
          >
            {{ item.label }}
            <span v-if="item.hint" class="ml-auto pl-4 text-sm text-faint">{{ item.hint }}</span>
          </DropdownMenuItem>
        </template>
      </DropdownMenuContent>
    </DropdownMenuPortal>
  </DropdownMenuRoot>
</template>
