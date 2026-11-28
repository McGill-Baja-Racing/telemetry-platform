<script setup lang="ts">
import { X } from "@lucide/vue";
import UiButton from "../ui/UiButton.vue";
import UiIconButton from "../ui/UiIconButton.vue";
import UiProgress from "../ui/UiProgress.vue";
import UiStatus from "../ui/UiStatus.vue";
import type { LogImport } from "./logImport.ts";

/** Where the import of a log file stands, under the title of Runs. */
const { state } = defineProps<{ state: LogImport }>();
const emit = defineEmits<{ cancel: []; dismiss: [] }>();

const percent = new Intl.NumberFormat(undefined, { style: "percent" });
</script>

<template>
  <div class="flex min-h-8 flex-wrap items-center gap-x-3 gap-y-1" role="status">
    <template v-if="state.step === 'uploading'">
      <UiProgress :value="state.progress" label="Upload" class="w-32" />
      <span class="text-muted">Uploading {{ state.name }}, {{ percent.format(state.progress) }}</span>
      <UiButton size="sm" variant="quiet" @click="emit('cancel')">Cancel</UiButton>
    </template>
    <template v-else-if="state.step === 'importing'">
      <UiStatus tone="info">Importing</UiStatus>
      <span class="text-muted">{{ state.name }}</span>
    </template>
    <template v-else>
      <UiStatus v-if="state.step === 'failed'" tone="crit">Not imported</UiStatus>
      <UiStatus v-else :tone="state.isNew ? 'ok' : 'info'">
        {{ state.isNew ? "Imported" : "Already imported" }}
      </UiStatus>
      <span class="text-muted">{{ state.step === "failed" ? state.error : state.name }}</span>
      <UiButton v-if="state.step === 'done'" size="sm" :to="`/runs/${state.id}`">Open run</UiButton>
      <UiIconButton label="Dismiss" size="sm" @click="emit('dismiss')"><X /></UiIconButton>
    </template>
  </div>
</template>
