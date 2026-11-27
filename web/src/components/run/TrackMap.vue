<script setup lang="ts">
import { computed, useTemplateRef } from "vue";
import { indexAt } from "./run.ts";

type Point = { lat: number; lon: number };

/**
 * The GPS track of a run, north up, with the shown range drawn stronger, the car at the cursor and
 * the start line. A click on the map picks the start line there.
 */
const { track, range, cursor, gate } = defineProps<{
  track: { time: number[]; lat: number[]; lon: number[] };
  /** Seconds from the start of the run; the whole run when null. */
  range: [number, number] | null;
  cursor: number | null;
  gate: Point[] | null;
}>();
const emit = defineEmits<{ pick: [point: Point] }>();

const svg = useTemplateRef("svg");
const WIDTH = 1000;
const PAD = 40;

/** Degrees to map units: longitude shrinks with the cosine of the latitude. */
const frame = computed(() => {
  const { lat, lon } = track;
  // Not Math.min(...lat): a long run has more fixes than a call takes arguments.
  const [south, north] = [lat.reduce((a, b) => Math.min(a, b)), lat.reduce((a, b) => Math.max(a, b))];
  const [west, east] = [lon.reduce((a, b) => Math.min(a, b)), lon.reduce((a, b) => Math.max(a, b))];
  const shrink = Math.cos((((south + north) / 2) * Math.PI) / 180);
  const scale = (WIDTH - 2 * PAD) / Math.max((east - west) * shrink, north - south, 1e-6);
  const height = Math.min(Math.max((north - south) * scale + 2 * PAD, 300), 1400);
  return { south, north, west, shrink, scale, height };
});

function toMap(lat: number, lon: number) {
  const { west, north, shrink, scale } = frame.value;
  return [PAD + (lon - west) * shrink * scale, PAD + (north - lat) * scale];
}

function pathOf(from: number, to: number) {
  let d = "";
  for (let i = from; i <= to; i++) {
    const [x, y] = toMap(track.lat[i], track.lon[i]);
    d += `${i === from ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  return d;
}

const whole = computed(() => pathOf(0, track.time.length - 1));
const shown = computed(() =>
  range ? pathOf(indexAt(track.time, range[0]), indexAt(track.time, range[1])) : "",
);
const car = computed(() => {
  if (cursor === null) return null;
  const index = indexAt(track.time, cursor);
  return toMap(track.lat[index], track.lon[index]);
});
const line = computed(() => gate?.map((point) => toMap(point.lat, point.lon).join(" ")).join(" L"));

function pick(event: PointerEvent) {
  const matrix = svg.value?.getScreenCTM()?.inverse();
  if (!matrix) return;
  const { x, y } = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix);
  const { west, north, shrink, scale } = frame.value;
  emit("pick", { lat: north - (y - PAD) / scale, lon: west + (x - PAD) / (shrink * scale) });
}
</script>

<template>
  <svg
    ref="svg"
    :viewBox="`0 0 ${WIDTH} ${frame.height}`"
    class="block w-full cursor-crosshair rounded-lg bg-sunk"
    role="img"
    aria-label="Track map with the car at the cursor"
    @pointerup="pick"
  >
    <path :d="whole" fill="none" stroke-width="10" stroke-linejoin="round" class="stroke-line-strong" />
    <path v-if="shown" :d="shown" fill="none" stroke-width="10" stroke-linejoin="round" class="stroke-faint" />
    <path v-if="line" :d="`M${line}`" stroke-width="12" stroke-linecap="round" class="stroke-fg" />
    <circle v-if="car" :cx="car[0]" :cy="car[1]" r="16" stroke-width="5" class="fill-live stroke-screen" />
  </svg>
</template>
