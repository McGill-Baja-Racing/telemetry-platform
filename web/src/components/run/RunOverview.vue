<script setup lang="ts">
import { computed, ref, useTemplateRef } from "vue";

/**
 * The whole run as a strip, with a tick where each lap starts and the range the charts show.
 * Dragging across it shows that range.
 */
const { time, values, duration, range, laps } = defineProps<{
  time: number[];
  values: (number | null)[];
  duration: number;
  range: [number, number] | null;
  laps: { start: number }[];
}>();
const emit = defineEmits<{ zoom: [from: number, to: number] }>();

const strip = useTemplateRef("strip");
const dragged = ref<[number, number] | null>(null);

const WIDTH = 1000;
const HEIGHT = 40;

/** The values as a filled area, the highest one 4 units below the top. */
const area = computed(() => {
  const max = values.reduce<number>((top, value) => Math.max(top, value ?? 0), 0) || 1;
  const xs: number[] = [];
  const ys: number[] = [];
  time.forEach((t, i) => {
    const value = values[i];
    if (value === null) return;
    xs.push((t / duration) * WIDTH);
    ys.push(HEIGHT - (value / max) * (HEIGHT - 4));
  });
  if (xs.length === 0) return "";
  const line = xs.map((x, i) => `${x.toFixed(1)} ${ys[i].toFixed(1)}`).join("L");
  return `M${xs[0].toFixed(1)} ${HEIGHT}L${line}L${xs.at(-1)?.toFixed(1)} ${HEIGHT}Z`;
});

const shown = computed(() => {
  const [from, to] = dragged.value ?? range ?? [0, 0];
  return to > from ? { left: percent(from), width: percent(to - from) } : null;
});

function percent(seconds: number) {
  return `${(seconds / duration) * 100}%`;
}

function secondsAt(event: PointerEvent) {
  const box = strip.value?.getBoundingClientRect();
  if (!box) return 0;
  return Math.min(Math.max((event.clientX - box.left) / box.width, 0), 1) * duration;
}

function start(event: PointerEvent) {
  (event.currentTarget as Element).setPointerCapture(event.pointerId);
  const at = secondsAt(event);
  dragged.value = [at, at];
}

function move(event: PointerEvent) {
  if (dragged.value) dragged.value = [dragged.value[0], secondsAt(event)];
}

function end() {
  if (!dragged.value) return;
  const [from, to] = dragged.value.toSorted((a, b) => a - b);
  dragged.value = null;
  if (to - from > duration / 500) emit("zoom", from, to);
}
</script>

<template>
  <div
    ref="strip"
    aria-hidden="true"
    class="relative h-10 cursor-ew-resize touch-none overflow-hidden rounded-md bg-sunk select-none"
    @pointerdown="start"
    @pointermove="move"
    @pointerup="end"
    @pointercancel="dragged = null"
  >
    <svg :viewBox="`0 0 ${WIDTH} ${HEIGHT}`" preserveAspectRatio="none" class="absolute inset-0 size-full" aria-hidden="true">
      <path :d="area" class="fill-faint/15 stroke-faint" stroke-width="1" vector-effect="non-scaling-stroke" />
    </svg>
    <span
      v-for="lap in laps"
      :key="lap.start"
      class="absolute inset-y-0 w-px bg-line-strong"
      :style="{ left: percent(lap.start) }"
    />
    <span
      v-if="shown"
      class="absolute inset-y-0 rounded-sm bg-selected inset-ring inset-ring-fg/40"
      :style="shown"
    />
  </div>
</template>
