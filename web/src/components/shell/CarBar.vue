<script setup lang="ts">
import { ChevronRight, CircleDot, Flag, RefreshCw, Square, Upload } from "@lucide/vue";
import { isFocusedElementEditable, onKeyStroke } from "@vueuse/core";
import { type RouteLocationRaw, RouterLink } from "vue-router";
import UiButton from "../ui/UiButton.vue";
import UiStatus from "../ui/UiStatus.vue";
import CarNumber from "./CarNumber.vue";

export type CarState = "recording" | "starting" | "idle" | "reconnecting" | "offline" | "connected";

/**
 * The car's state, always at the bottom: the full bar on a computer, a small one on a phone that
 * opens `to` (the Live page). It never blocks: a command shows what it waits for, and a lost
 * connection says that the car keeps recording. Each button appears once its event is handled
 * (`@stop`, `@mark`, …). `connected` is for when the app reaches the car without knowing whether
 * it records.
 */
const {
  state,
  number,
  detail,
  values = [],
  warnings = 0,
  layout = "auto",
  to,
  onStart,
  onStop,
  onMark,
  onCancel,
  onRetry,
  onImport,
  onWarnings,
} = defineProps<{
  state: CarState;
  number: string;
  /** The line under the state: the run and its time, or when the car was last seen. */
  detail?: string;
  values?: { label: string; value: string; unit?: string }[];
  warnings?: number;
  /** `auto` picks the full bar on a computer and the small one on a phone. */
  layout?: "auto" | "full" | "small";
  to?: RouteLocationRaw;
  onStart?: () => void;
  onStop?: () => void;
  onMark?: () => void;
  onCancel?: () => void;
  onRetry?: () => void;
  onImport?: () => void;
  onWarnings?: () => void;
}>();

onKeyStroke(["r", "m"], (event) => {
  if (isFocusedElementEditable() || event.metaKey || event.ctrlKey || event.altKey) return;
  if (event.key === "r" && state === "idle") onStart?.();
  if (event.key === "m" && state === "recording") onMark?.();
});

const labels: Record<CarState, string> = {
  recording: "Recording",
  starting: "Starting",
  idle: "Connected, not recording",
  reconnecting: "Reconnecting",
  offline: "Car offline",
  connected: "Connected",
};
</script>

<template>
  <section aria-label="Car status">
    <component
      :is="to ? RouterLink : 'div'"
      :to
      class="mx-2.5 items-center gap-2.5 rounded-2xl bg-chrome px-2.5 py-2"
      :class="{ 'flex lg:hidden': layout === 'auto', flex: layout === 'small', hidden: layout === 'full' }"
    >
      <CarNumber size="sm" :idle="state === 'offline'">{{ number }}</CarNumber>
      <span class="grid min-w-0 flex-1 leading-tight">
        <span class="flex items-center gap-1.75 text-sm font-semibold" :class="{ 'text-muted': state === 'offline' }">
          <span v-if="state === 'recording'" class="size-2 rounded-full bg-live" />
          <span v-else-if="state === 'idle'" class="size-2 rounded-full inset-ring inset-ring-faint" />
          <UiStatus v-else-if="state === 'reconnecting'" tone="warn" />
          <UiStatus v-else-if="state === 'connected'" tone="ok" />
          {{ labels[state] }}
        </span>
        <span class="truncate text-xs text-faint">{{ detail }}</span>
      </span>
      <span
        v-if="values[0] && (state === 'recording' || state === 'reconnecting')"
        class="num text-2xl font-semibold"
        :class="{ 'opacity-45': state === 'reconnecting' }"
      >
        {{ values[0].value }}<small class="ml-1 text-xs font-medium tracking-normal text-faint font-stretch-100%">{{ values[0].unit }}</small>
      </span>
      <ChevronRight v-if="to" class="text-faint" />
    </component>

    <div
      class="@container min-h-16 flex-wrap items-center gap-x-5 gap-y-2 bg-chrome py-2.5 pr-3.5 pl-4.5"
      :class="{ 'hidden lg:flex': layout === 'auto', flex: layout === 'full', hidden: layout === 'small' }"
    >
      <div class="flex min-w-53.5 flex-none items-center gap-2.75">
        <CarNumber :idle="state === 'offline'">{{ number }}</CarNumber>
        <div class="grid leading-snug whitespace-nowrap">
          <span v-if="state === 'recording'" class="inline-flex items-center gap-1.75 font-semibold">
            <span class="size-2 rounded-full bg-live" />{{ labels[state] }}
          </span>
          <span v-else-if="state === 'idle'" class="inline-flex items-center gap-1.75 font-semibold">
            <span class="size-2 rounded-full inset-ring inset-ring-faint" />{{ labels[state] }}
          </span>
          <UiStatus v-else-if="state === 'reconnecting'" tone="warn">{{ labels[state] }}</UiStatus>
          <UiStatus v-else-if="state === 'connected'" tone="ok">{{ labels[state] }}</UiStatus>
          <b v-else class="font-semibold" :class="{ 'text-muted': state === 'offline' }">{{ labels[state] }}</b>
          <small class="text-xs text-faint tabular-nums">
            {{ detail ?? (state === "starting" ? "Waiting for GPS time, up to 3 s" : "") }}
          </small>
        </div>
      </div>

      <div class="hidden min-w-0 flex-1 justify-center @4xl:flex">
        <span v-if="state === 'starting'" class="text-faint">
          The recording starts on its own. You can keep using the app.
        </span>
        <span v-else-if="state === 'offline'" class="text-faint">Past runs stay available.</span>
        <template v-else>
          <span
            v-for="item in values"
            :key="item.label"
            class="grid gap-0.75 px-5.5 py-0.5 whitespace-nowrap not-first:border-l not-first:border-line-strong"
            :class="{ 'opacity-45': state === 'reconnecting' }"
          >
            <span class="text-xs leading-tight text-faint">{{ item.label }}</span>
            <span class="num text-xl font-semibold">
              {{ item.value }}<small class="ml-0.75 text-xs font-medium tracking-normal text-faint font-stretch-100%">{{ item.unit }}</small>
            </span>
          </span>
        </template>
      </div>

      <div class="ml-auto flex items-center gap-2">
        <template v-if="state === 'recording'">
          <UiButton v-if="warnings && onWarnings" variant="quiet" @click="onWarnings">
            <UiStatus tone="warn" />{{ warnings }} {{ warnings === 1 ? "warning" : "warnings" }}
          </UiButton>
          <UiButton v-if="onStop" @click="onStop"><Square />Stop</UiButton>
          <UiButton v-if="onMark" variant="live" shortcut="M" @click="onMark"><Flag />Mark moment</UiButton>
        </template>
        <UiButton v-else-if="state === 'starting' && onCancel" @click="onCancel">Cancel</UiButton>
        <UiButton v-else-if="state === 'idle' && onStart" variant="live" shortcut="R" @click="onStart">
          <CircleDot />Start recording
        </UiButton>
        <template v-else-if="state === 'reconnecting'">
          <span class="hidden max-w-62.5 text-sm leading-snug text-muted @2xl:inline">
            The car keeps recording on its SD card. Nothing is lost.
          </span>
          <UiButton v-if="onRetry" @click="onRetry"><RefreshCw />Retry now</UiButton>
        </template>
        <UiButton v-else-if="state === 'offline' && onImport" @click="onImport"><Upload />Import a log file</UiButton>
      </div>
    </div>
  </section>
</template>
