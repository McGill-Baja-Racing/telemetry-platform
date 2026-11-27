<script setup lang="ts">
import { type RouteLocationRaw, RouterLink } from "vue-router";
import UiKbd from "./UiKbd.vue";

const {
  variant = "default",
  size = "md",
  to,
  shortcut,
} = defineProps<{
  /**
   * `primary` for the one main action of a page, `live` (red) for an action on the car right now,
   * `quiet` for minor actions such as "All runs".
   */
  variant?: "default" | "primary" | "quiet" | "live";
  /** `lg` is for the main actions on a phone, such as Stop and Mark moment on Live. */
  size?: "sm" | "md" | "lg";
  /** Makes the button a link to this route. */
  to?: RouteLocationRaw;
  /** The key that triggers it, shown inside the button. */
  shortcut?: string;
}>();

const variants = {
  default: "text-fg inset-ring inset-ring-line-strong hover:bg-hover [&_.lucide]:text-muted",
  primary: "bg-ink text-on-ink hover:bg-ink/88",
  quiet: "text-muted hover:bg-hover hover:text-fg [&_.lucide]:text-muted",
  live: "bg-live text-on-live hover:brightness-90",
};

const sizes = {
  sm: "h-7 rounded-md px-2.5 text-sm pointer-coarse:h-10",
  md: "h-8 rounded-md px-3 pointer-coarse:h-11",
  lg: "h-13.5 justify-center rounded-2xl px-4.5 text-lg [&_.lucide]:size-4.5",
};
</script>

<template>
  <component
    :is="to ? RouterLink : 'button'"
    :to
    :type="to ? undefined : 'button'"
    class="inline-flex cursor-pointer items-center gap-1.75 font-medium whitespace-nowrap transition not-disabled:active:scale-97 disabled:cursor-default disabled:opacity-50 [&_.lucide]:size-3.75"
    :class="[variants[variant], sizes[size]]"
  >
    <slot />
    <UiKbd v-if="shortcut" class="-mr-1" :inverse="variant === 'primary' || variant === 'live'">
      {{ shortcut }}
    </UiKbd>
  </component>
</template>
