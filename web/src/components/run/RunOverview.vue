<script setup lang="ts">
import { useElementSize } from "@vueuse/core";
import { computed, ref, useTemplateRef } from "vue";
import { formatClock } from "../../format.ts";
import { type Lap, lapAt, lapOf } from "./run.ts";

/**
 * The whole run as a strip, with its laps and the range the charts show. Clicking a lap shows it,
 * dragging across the strip shows that range.
 */
const { time, values, duration, range, laps } = defineProps<{
  time: number[];
  values: (number | null)[];
  duration: number;
  range: [number, number] | null;
  laps: Lap[];
}>();
const emit = defineEmits<{ zoom: [from: number, to: number] }>();

const strip = useTemplateRef("strip");
const { width } = useElementSize(strip);
const dragged = ref<[number, number] | null>(null);
const picked = computed(() => {
  const found = range ? lapOf(laps, range) : undefined;
  return found?.whole ? found.index : -1;
});

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

/** A click is a drag too short to zoom: it picks the lap under it. */
function end() {
  if (!dragged.value) return;
  const [from, to] = dragged.value.toSorted((a, b) => a - b);
  dragged.value = null;
  const lap = laps[lapAt(laps, from)];
  if (to - from > duration / 500) emit("zoom", from, to);
  else if (lap) emit("zoom", lap.start, lap.end);
}

/** A lap's number and time, where they fit. */
function lapLabel(lap: Lap, index: number) {
  const fits = ((lap.end - lap.start) / duration) * width.value > 56;
  return fits ? `${index + 1}  ${formatClock(lap.end - lap.start, false)}` : "";
}
</script>

<template>
  <div
    ref="strip"
    class="relative h-10 cursor-ew-resize touch-none overflow-hidden rounded-md bg-sunk select-none"
    @pointerdown="start"
    @pointermove="move"
    @pointerup="end"
    @pointercancel="dragged = null"
  >
    <svg :viewBox="`0 0 ${WIDTH} ${HEIGHT}`" preserveAspectRatio="none" class="absolute inset-0 size-full" aria-hidden="true">
      <path :d="area" class="fill-faint/15 stroke-faint" stroke-width="1" vector-effect="non-scaling-stroke" />
    </svg>
    <button
      v-for="(lap, index) in laps"
      :key="lap.start"
      type="button"
      class="num absolute inset-y-0 cursor-pointer overflow-hidden border-l border-line-strong px-1.5 pt-1 text-left text-2xs leading-none font-medium whitespace-pre transition-colors hover:bg-hover"
      :class="index === picked ? 'text-fg' : 'text-faint'"
      :style="{ left: percent(lap.start), width: percent(lap.end - lap.start) }"
      :title="`Lap ${index + 1}, ${formatClock(lap.end - lap.start)}`"
      @click="emit('zoom', lap.start, lap.end)"
    >
      {{ lapLabel(lap, index) }}
    </button>
    <span
      v-if="shown"
      class="pointer-events-none absolute inset-y-0 rounded-sm bg-selected inset-ring inset-ring-fg/40"
      :style="shown"
    />
  </div>
</template>
