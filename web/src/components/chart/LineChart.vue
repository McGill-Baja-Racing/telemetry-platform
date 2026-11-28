<script setup lang="ts">
import { Ellipsis } from "@lucide/vue";
import { useResizeObserver } from "@vueuse/core";
import uPlot from "uplot";
import "uplot/dist/uPlot.min.css";
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from "vue";
import { useTheme } from "../../composables/useTheme.ts";
import { formatClock, formatValue } from "../../format.ts";
import type { MenuItem } from "../ui/types.ts";
import UiIconButton from "../ui/UiIconButton.vue";
import UiMenu from "../ui/UiMenu.vue";
import { lastValue, MAX_SPAN_SECONDS, withGaps } from "./gaps.ts";
import { type ChartMarks, markHooks, yScale } from "./marks.ts";
import { smooth } from "./smooth.ts";
import type { ChartSeries } from "./types.ts";

/**
 * A time series chart, drawn with uPlot. One unit per chart: two measures go in two charts with
 * the same `sync` key, which then share one cursor. The legend shows the values at the cursor, or
 * the latest values when the cursor is elsewhere. Dragging across the chart asks for that range with
 * `zoom`: the page loads it in more detail. The default slot goes under the title.
 */
const {
  title,
  unit,
  time,
  axis = "time",
  series,
  height = 180,
  sync,
  digits = 0,
  menu = [],
  yRange,
  smoothing = 0,
  marks,
  reference,
} = defineProps<{
  title: string;
  unit?: string;
  /** Seconds since the start of the run, one per sample, or metres on a distance axis. */
  time: number[];
  axis?: "time" | "distance";
  series: ChartSeries[];
  height?: number;
  sync?: string;
  /** Decimals shown in the legend. */
  digits?: number;
  menu?: MenuItem[];
  /** A fixed y axis; it fits the data otherwise. */
  yRange?: [number, number];
  /** Seconds each line is averaged over, only as drawn. The legend shows the drawn values. */
  smoothing?: number;
  marks?: ChartMarks;
  /** A value drawn as a dashed line, such as a threshold. The y axis then fits it too. */
  reference?: number;
}>();

const emit = defineEmits<{
  zoom: [from: number, to: number];
  /** The index in `time` under the cursor, or null when the cursor leaves. */
  cursor: [index: number | null];
}>();

const frame = useTemplateRef("frame");
const plot = useTemplateRef("plot");
const theme = useTheme();
const cursor = ref<{ index: number; left: number; top: number } | null>(null);
let chart: uPlot | null = null;

const legendIndex = computed(() => cursor.value?.index ?? time.length - 1);
const lines = computed(() =>
  series.map((line) => (smoothing ? smooth(time, line.values, smoothing) : line.values)),
);

function formatX(value: number, precise = true) {
  return axis === "distance" ? `${Math.round(value)} m` : formatClock(value, precise);
}

/** The longest silence a line is drawn across: on a distance axis, about 2 s at 40 km/h. */
const maxSpan = () => (axis === "distance" ? 20 : MAX_SPAN_SECONDS);

function valueAt(values: (number | null)[]) {
  return formatValue(lastValue(time, values, legendIndex.value, maxSpan()), digits);
}

function data(): uPlot.AlignedData {
  return [time, ...lines.value.map((values) => withGaps(time, values, maxSpan()))];
}

function onSelect(self: uPlot) {
  const { left, width } = self.select;
  if (width > 2) emit("zoom", self.posToVal(left, "x"), self.posToVal(left + width, "x"));
  self.setSelect({ left: 0, top: 0, width: 0, height: 0 }, false);
}

function onCursor(self: uPlot) {
  const { idx, left } = self.cursor;
  if (idx === null || idx === undefined || left === undefined || left < 0 || !frame.value) {
    if (cursor.value) emit("cursor", null);
    cursor.value = null;
    return;
  }
  if (cursor.value?.index !== idx) emit("cursor", idx);
  const over = self.over.getBoundingClientRect();
  const box = frame.value.getBoundingClientRect();
  cursor.value = { index: idx, left: over.left - box.left + left, top: over.bottom - box.top };
}

function draw() {
  chart?.destroy();
  if (!plot.value) return;

  const style = getComputedStyle(document.documentElement);
  const token = (name: string) => style.getPropertyValue(`--color-${name}`).trim() || name;
  const font = `11px ${style.getPropertyValue("--font-sans")}`;
  const strokes = series.map((line) => token(line.color));
  const axisStyle: uPlot.Axis = {
    stroke: token("faint"),
    font,
    ticks: { show: false },
    grid: { stroke: token("line"), width: 1 },
  };

  chart = new uPlot(
    {
      width: plot.value.clientWidth,
      height,
      legend: { show: false },
      padding: [8, 4, 0, 0],
      scales: { x: { time: false }, y: yScale(yRange, reference) },
      cursor: {
        y: false,
        drag: { x: true, y: false, setScale: false },
        sync: sync ? { key: sync } : undefined,
        points: { size: 9, width: 2, stroke: token("screen"), fill: (_, index) => strokes[index - 1] ?? "" },
      },
      axes: [
        { ...axisStyle, size: 28, values: (_, ticks) => ticks.map((tick) => formatX(tick, false)) },
        { ...axisStyle, size: 44, values: (_, ticks) => ticks.map((tick) => tick.toLocaleString()) },
      ],
      series: [{}, ...series.map((line, index) => ({ label: line.label, stroke: strokes[index], width: 1.5 }))],
      hooks: {
        setSelect: [onSelect],
        setCursor: [onCursor],
        ...markHooks(() => ({ marks, reference }), token, font),
      },
    },
    data(),
    plot.value,
  );
}

onMounted(draw);
onBeforeUnmount(() => chart?.destroy());
// After the theme is applied to the page, or the chart reads the old theme's colours.
watch(() => theme.state.value, draw, { flush: "post" });
watch([() => yRange, () => reference], draw);
watch(
  () => marks,
  () => chart?.redraw(false),
);
watch(
  lines,
  () => {
    if (chart && chart.series.length === series.length + 1) {
      chart.setData(data());
    } else {
      draw();
    }
  },
);
useResizeObserver(plot, ([entry]) => {
  if (entry) chart?.setSize({ width: entry.contentRect.width, height });
});
</script>

<template>
  <figure ref="frame" class="relative m-0 min-w-0">
    <figcaption class="flex flex-wrap items-baseline gap-x-2.5 gap-y-1.5 pb-2 pl-11">
      <h3>{{ title }}</h3>
      <span v-if="unit" class="text-sm text-faint">{{ unit }}</span>
      <span class="ml-auto flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
        <span v-for="(line, index) in series" :key="line.label" class="inline-flex items-center gap-1.5">
          <i class="h-0.75 w-3 rounded-xs" :style="{ background: `var(--color-${line.color})` }" />
          {{ line.label }}
          <b class="num min-w-8 text-right font-semibold text-fg">{{ valueAt(lines[index]) }}</b>
        </span>
      </span>
      <UiMenu v-if="menu.length" :items="menu">
        <UiIconButton label="Chart options" size="sm" class="-my-1">
          <Ellipsis />
        </UiIconButton>
      </UiMenu>
    </figcaption>
    <slot />
    <div ref="plot" class="chart-plot" />
    <span
      v-if="cursor"
      class="num pointer-events-none absolute -translate-x-1/2 rounded-sm bg-live px-1.5 py-1 text-2xs leading-none font-semibold whitespace-nowrap text-on-live"
      :style="{ left: `${cursor.left}px`, top: `${cursor.top + 3}px` }"
    >
      {{ formatX(time[cursor.index] ?? 0) }}
    </span>
  </figure>
</template>

<style scoped>
/* uPlot draws its cursor line in the page, outside the canvas: it is the live red, like the pill. */
.chart-plot :deep(.u-cursor-x) {
  border-right: 1.5px solid var(--color-live);
}

.chart-plot :deep(.u-select) {
  background: var(--color-selected);
}
</style>
