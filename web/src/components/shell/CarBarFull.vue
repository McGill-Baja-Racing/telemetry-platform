<script setup lang="ts">
import { CircleDot, Flag, RefreshCw, Square, Upload } from "@lucide/vue";
import { isFocusedElementEditable, onKeyStroke } from "@vueuse/core";
import UiButton from "../ui/UiButton.vue";
import UiStatus from "../ui/UiStatus.vue";
import UiValue from "../ui/UiValue.vue";
import CarNumber from "./CarNumber.vue";
import CarStateLabel from "./CarStateLabel.vue";
import type { CarState, CarValue } from "./car.ts";

/**
 * The car's state at the bottom of the screen on a computer. It never blocks: a command shows what
 * it waits for, and a lost connection says that the car keeps recording. Each button appears once
 * its event is handled (`@stop`, `@mark`, …).
 */
const {
  state,
  number,
  detail,
  values = [],
  warnings = 0,
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
  values?: CarValue[];
  warnings?: number;
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
</script>

<template>
  <section
    aria-label="Car status"
    class="@container flex min-h-16 flex-wrap items-center gap-x-5 gap-y-2 bg-chrome py-2.5 pr-3.5 pl-4.5"
  >
    <div class="flex min-w-53.5 flex-none items-center gap-2.75">
      <CarNumber :idle="state === 'offline'">{{ number }}</CarNumber>
      <div class="grid leading-snug">
        <CarStateLabel :state />
        <small class="text-xs whitespace-nowrap text-faint tabular-nums">
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
          <UiValue :value="item.value" :unit="item.unit" class="text-xl" />
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
  </section>
</template>
