<script setup lang="ts">
import { computed } from "vue";
import UiButton from "../ui/UiButton.vue";
import UiKeyValues from "../ui/UiKeyValues.vue";
import { useRun } from "./queries.ts";
import { type Lap, runFacts } from "./run.ts";
import TrackMap from "./TrackMap.vue";

/** The run picked in the list: its track, when, how long and how far, and its laps. */
const { run } = defineProps<{
  run: { id: number; name: string; startedAt: string; endedAt: string; gpsTime: boolean };
}>();

const loaded = useRun(() => String(run.id));
const { hasTrack, startLine } = loaded;
const { data: track, isError: trackFailed } = loaded.track;
const laps = computed<Lap[]>(() => loaded.laps.data.value?.laps ?? []);
const gate = computed(() => loaded.laps.data.value?.gate ?? null);
const facts = computed(() => runFacts(run, track.value?.distance.at(-1), laps.value));
const trackState = computed(() => {
  if (trackFailed.value) return "The track could not be loaded";
  return track.value ? "No GPS track" : "Loading the track";
});
</script>

<template>
  <aside class="grid content-start gap-4" aria-label="Selected run">
    <TrackMap v-if="track && hasTrack" :track :range="null" :cursor="null" :gate @pick="startLine = $event" />
    <div v-else class="grid aspect-video place-items-center rounded-lg bg-sunk text-sm text-faint">
      {{ trackState }}
    </div>
    <h2 class="truncate">{{ run.name }}</h2>
    <UiKeyValues :items="facts" />
    <p v-if="hasTrack && !gate" class="text-sm text-faint">Click the track to set the start line.</p>
    <UiButton variant="primary" :to="`/runs/${run.id}`" class="justify-center">Open run</UiButton>
  </aside>
</template>
