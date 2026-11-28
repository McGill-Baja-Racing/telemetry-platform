<script setup lang="ts">
import { computed, ref } from "vue";
import { formatClock, testDay } from "../../format.ts";
import type { Lap } from "../run/run.ts";
import type { Option } from "../ui/types.ts";
import UiButton from "../ui/UiButton.vue";
import UiIssue from "../ui/UiIssue.vue";
import UiSelect from "../ui/UiSelect.vue";
import UiValue from "../ui/UiValue.vue";

/**
 * One of the two laps compared: its run, its number and time, or why it has none. "Change" picks
 * another run or lap. `color` is the token of the lap's key.
 */
const { color, runs, run, laps, lap, number, problem } = defineProps<{
  color: string;
  runs: Option[];
  run?: { id: number; name: string; startedAt: string; gpsTime: boolean };
  laps: Lap[];
  lap?: Lap;
  number?: number;
  problem?: string;
}>();
const emit = defineEmits<{ run: [id: string]; lap: [number: number] }>();

const changing = ref(false);

const detail = computed(() => {
  if (!run) return "";
  const day = run.gpsTime ? testDay(run.startedAt) : "No GPS time";
  return number ? `Lap ${number} of ${laps.length}, ${day}` : day;
});

const lapOptions = computed(() =>
  laps.map((each, index) => ({
    label: `Lap ${index + 1}, ${formatClock(each.end - each.start)}`,
    value: String(index + 1),
  })),
);

function pickRun(id: string | undefined) {
  if (id) emit("run", id);
}

function pickLap(value: string | undefined) {
  if (value) emit("lap", Number(value));
}
</script>

<template>
  <div class="grid content-start gap-3 py-3.5">
    <div class="flex items-center gap-3.5">
      <i class="h-1 w-4.5 flex-none rounded-xs" :style="{ background: `var(--color-${color})` }" />
      <div class="grid min-w-0 flex-1 gap-px">
        <b class="truncate font-semibold">{{ run?.name ?? "Pick a run" }}</b>
        <span v-if="detail" class="text-sm text-faint">{{ detail }}</span>
      </div>
      <UiValue v-if="lap" :value="formatClock(lap.end - lap.start)" class="text-3xl" />
      <UiButton v-if="run" variant="quiet" size="sm" class="-mr-2.5" @click="changing = !changing">
        {{ changing ? "Done" : "Change" }}
      </UiButton>
    </div>
    <div v-if="changing || !run" class="flex min-w-0 flex-wrap gap-2">
      <UiSelect
        label="Run"
        placeholder="Pick a run"
        :options="runs"
        :model-value="run ? String(run.id) : undefined"
        @update:model-value="pickRun"
      />
      <UiSelect
        v-if="laps.length"
        label="Lap"
        :options="lapOptions"
        :model-value="number ? String(number) : undefined"
        @update:model-value="pickLap"
      />
    </div>
    <UiIssue v-if="problem" :title="problem">
      <UiButton v-if="run" size="sm" :to="`/runs/${run.id}`">Open run</UiButton>
    </UiIssue>
  </div>
</template>
