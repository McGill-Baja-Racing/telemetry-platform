<script setup lang="ts">
import { ChevronLeft, ChevronRight, X } from "@lucide/vue";
import { useQuery } from "@tanstack/vue-query";
import { computed, ref, watchEffect } from "vue";
import { formatClock } from "../../format.ts";
import type { Signal } from "../../signals.ts";
import UiIconButton from "../ui/UiIconButton.vue";
import UiSegmented from "../ui/UiSegmented.vue";
import UiSelect from "../ui/UiSelect.vue";
import UiTextField from "../ui/UiTextField.vue";
import { readSamples } from "./queries.ts";
import { type Highlight, momentsOf } from "./run.ts";

/**
 * Picks a signal and a value to highlight the moments it is above or below, counts them over the
 * whole run, and steps from one to the next.
 */
const { runId, signals, range } = defineProps<{
  runId: string;
  signals: Signal[];
  /** Seconds from the start of the run that the charts show; the whole run when null. */
  range: [number, number] | null;
}>();
const highlight = defineModel<Highlight | null>({ required: true });
const emit = defineEmits<{ zoom: [from: number, to: number] }>();

const name = ref<string>();
const direction = ref<"above" | "below">("above");
const value = ref("");
/** Only a signal of this run, in case the page moved to another run. */
const picked = computed(() => signals.find((signal) => signal.name === name.value));
const options = computed(() => signals.map((signal) => ({ label: signal.label, value: signal.name })));

watchEffect(() => {
  const threshold = Number(value.value);
  const signal = picked.value?.name;
  const ready = signal !== undefined && value.value !== "" && Number.isFinite(threshold);
  highlight.value = ready ? { signal, above: direction.value === "above", value: threshold } : null;
});

/** The whole run in as much detail as the API gives, to find every moment. */
const { data: whole } = useQuery({
  queryKey: ["highlight", computed(() => runId), name],
  queryFn: () => readSamples({ id: runId }, [picked.value?.name ?? ""], 10_000, null),
  enabled: computed(() => picked.value !== undefined),
});
const moments = computed(() =>
  whole.value && highlight.value ? momentsOf(whole.value, highlight.value) : [],
);

/** Moments are found by the middle of the range, to the millisecond the address keeps. */
const MS = 0.001;
const middle = computed(() => (range ? (range[0] + range[1]) / 2 : undefined));
const current = computed(() => {
  const at = middle.value;
  if (at === undefined) return -1;
  return moments.value.findIndex(([from, to]) => from - MS <= at && at <= to + MS);
});
const previous = computed(() => {
  const at = middle.value;
  return at === undefined ? moments.value.at(-1) : moments.value.findLast(([, to]) => to < at - MS);
});
const next = computed(() => {
  const at = middle.value;
  return at === undefined ? moments.value[0] : moments.value.find(([from]) => from > at + MS);
});

const summary = computed(() => {
  const count = moments.value.length;
  if (!whole.value || !highlight.value) return "";
  if (count === 0) return "Not once in this run";
  const total = moments.value.reduce((sum, [from, to]) => sum + to - from, 0);
  const which = current.value < 0 ? `${count} moments` : `Moment ${current.value + 1} of ${count}`;
  return `${which}, ${formatClock(total, false)} in all`;
});

/** Shows a moment with some time around it. */
function show(moment: [number, number] | undefined) {
  if (!moment) return;
  const around = Math.max(2, (moment[1] - moment[0]) / 2);
  emit("zoom", moment[0] - around, moment[1] + around);
}

function clear() {
  name.value = undefined;
  value.value = "";
}
</script>

<template>
  <div class="flex flex-wrap items-center gap-2">
    <UiSelect v-model="name" label="Highlight" placeholder="a signal" :options />
    <UiSegmented
      v-model="direction"
      label="Above or below"
      :options="[
        { label: 'Above', value: 'above' },
        { label: 'Below', value: 'below' },
      ]"
    />
    <UiTextField v-model="value" type="number" label="Value" placeholder="Value" class="w-28" />
    <span v-if="picked" class="text-sm text-faint">{{ picked.unit }}</span>
    <template v-if="highlight">
      <span class="num ml-auto text-sm text-muted">{{ summary }}</span>
      <UiIconButton label="Previous moment" size="sm" :disabled="!previous" @click="show(previous)">
        <ChevronLeft />
      </UiIconButton>
      <UiIconButton label="Next moment" size="sm" :disabled="!next" @click="show(next)">
        <ChevronRight />
      </UiIconButton>
    </template>
    <UiIconButton v-if="name" label="Clear the highlight" size="sm" @click="clear">
      <X />
    </UiIconButton>
  </div>
</template>
