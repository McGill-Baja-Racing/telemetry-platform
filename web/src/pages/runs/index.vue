<script setup lang="ts">
import { GitCompare, Search, Upload, X } from "@lucide/vue";
import { useQuery } from "@tanstack/vue-query";
import { useLocalStorage, useMediaQuery } from "@vueuse/core";
import { parseResponse } from "hono/client";
import { computed, ref, useTemplateRef } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import { client } from "../../api.ts";
import { useLogImport } from "../../components/run/logImport.ts";
import RunImportStatus from "../../components/run/RunImportStatus.vue";
import RunPreview from "../../components/run/RunPreview.vue";
import { durationOf, formatStarted } from "../../components/run/run.ts";
import type { Column, DayRange, Sort } from "../../components/ui/types.ts";
import UiButton from "../../components/ui/UiButton.vue";
import UiCheckbox from "../../components/ui/UiCheckbox.vue";
import UiDateRange from "../../components/ui/UiDateRange.vue";
import UiIconButton from "../../components/ui/UiIconButton.vue";
import UiIssue from "../../components/ui/UiIssue.vue";
import UiPage from "../../components/ui/UiPage.vue";
import UiTable from "../../components/ui/UiTable.vue";
import UiTextField from "../../components/ui/UiTextField.vue";
import { formatClock, formatDays, isDay, localDay, testDay } from "../../format.ts";

const {
  data: recordings,
  error,
  refetch,
} = useQuery({
  queryKey: ["recordings"],
  queryFn: () => parseResponse(client.api.recordings.$get()),
});

const route = useRoute("/runs/");
const router = useRouter();

/**
 * The search and the days shown are kept in the address: coming back from a run finds the list as
 * it was, and a link shows the same runs.
 */
const search = computed({
  get: () => String(route.query.q ?? ""),
  set: (q) => router.replace({ query: { ...route.query, q: q || undefined } }),
});
const days = computed({
  get: (): DayRange | null => {
    const { from, to } = route.query;
    return isDay(from) && isDay(to) && from <= to ? [from, to] : null;
  },
  set: (range: DayRange | null) =>
    router.replace({ query: { ...route.query, from: range?.[0], to: range?.[1] } }),
});
const sort = ref<Sort>({ key: "started", descending: true });

/** Newest first, as the API lists them. Without GPS time, a run counts from 1970 and has no day. */
const all = computed(() =>
  (recordings.value ?? []).map((run) => ({
    ...run,
    started: Date.parse(run.startedAt),
    duration: durationOf(run),
    day: run.gpsTime ? localDay(run.startedAt) : undefined,
  })),
);
type Run = (typeof all.value)[number];
/** The days with runs, oldest first. */
const runDays = computed(() => [...new Set(all.value.flatMap((run) => run.day ?? []))].sort());

const runs = computed(() => {
  const text = search.value.trim().toLowerCase();
  const range = days.value;
  const inRange = (day?: string) => day !== undefined && range !== null && range[0] <= day && day <= range[1];
  return all.value.filter((run) => run.name.toLowerCase().includes(text) && (!range || inRange(run.day)));
});

/** By date, runs are grouped by test day; those without GPS time go last. */
const byDay = computed(() => sort.value.key === "started");
const dayName = (run: Run) => (run.day ? testDay(run.startedAt) : "No GPS time");
const time = new Intl.DateTimeFormat(undefined, { timeStyle: "short" });

/** The days closed in the list, kept on this computer. */
const collapsed = useLocalStorage<string[]>("runs-collapsed-days", []);
const dayNames = computed(() => [...new Set(runs.value.map(dayName))]);
const allCollapsed = computed(() => dayNames.value.every((name) => collapsed.value.includes(name)));

const columns: Column[] = [
  { key: "select", label: "", optional: true },
  { key: "name", label: "Run", sortable: true },
  { key: "started", label: "Started", optional: true, sortable: true },
  { key: "duration", label: "Duration", align: "right", sortable: true },
  { key: "sampleCount", label: "Samples", align: "right", optional: true, sortable: true },
];

/** On a phone there is no room for the preview: a row opens its run. */
const hasPreview = useMediaQuery("(min-width: 64rem)");
const picked = ref<number>();
/** The preview follows the list: it never shows a run of a closed day. */
const listed = computed(() =>
  byDay.value ? runs.value.filter((run) => !collapsed.value.includes(dayName(run))) : runs.value,
);
const previewed = computed(() => listed.value.find((run) => run.id === picked.value) ?? listed.value[0]);

function pick(run: Run) {
  if (hasPreview.value) picked.value = run.id;
  else router.push(`/runs/${run.id}`);
}

/** Up and down move from run to run, and the preview follows. */
function step(event: KeyboardEvent) {
  const by = { ArrowDown: 1, ArrowUp: -1 }[event.key];
  const from = event.target as HTMLElement;
  if (!by || !from.matches("[data-run]")) return;
  event.preventDefault();
  const links = [...document.querySelectorAll<HTMLElement>("[data-run]")];
  links[links.indexOf(from) + by]?.focus();
}

/** Compare takes two runs. */
const selected = ref<number[]>([]);
function select(id: number, on: boolean) {
  selected.value = on ? [...selected.value, id] : selected.value.filter((other) => other !== id);
}
const compareLink = computed(() =>
  selected.value.length === 2 ? `/compare?runs=${selected.value.join(",")}` : undefined,
);

const picker = useTemplateRef("picker");
const logImport = useLogImport((id) => {
  picked.value = id;
});
const importing = computed(() => ["uploading", "importing"].includes(logImport.state.value?.step ?? ""));

function importFiles(input: HTMLInputElement) {
  logImport.start([...(input.files ?? [])]);
  // Picking the same file again must still start an import.
  input.value = "";
}
</script>

<template>
  <div class="flex min-h-full flex-col">
    <UiPage title="Runs" class="flex-1">
      <template #actions>
        <UiButton :disabled="importing" @click="picker?.click()"><Upload />Import a log file</UiButton>
        <input
          ref="picker"
          type="file"
          accept=".bin,.utc"
          multiple
          hidden
          @change="importFiles($event.target as HTMLInputElement)"
        />
      </template>
      <template v-if="logImport.state.value" #details>
        <RunImportStatus :state="logImport.state.value" @cancel="logImport.cancel" @dismiss="logImport.dismiss" />
      </template>

      <div class="flex flex-wrap items-center gap-2.5">
        <UiTextField v-model="search" type="search" label="Search runs" placeholder="Name or file" class="w-full sm:w-65">
          <Search />
        </UiTextField>
        <UiDateRange v-model="days" label="Date" :marked="runDays" />
        <UiButton
          v-if="byDay && dayNames.length > 1"
          variant="quiet"
          size="sm"
          class="ml-auto"
          @click="collapsed = allCollapsed ? [] : dayNames"
        >
          {{ allCollapsed ? "Expand all" : "Collapse all" }}
        </UiButton>
      </div>

      <UiIssue v-if="error" tone="crit" title="The runs could not be loaded" :effect="error.message">
        <UiButton size="sm" @click="refetch()">Try again</UiButton>
      </UiIssue>
      <p v-else-if="!recordings" class="text-faint">Loading the runs…</p>
      <p v-else-if="recordings.length === 0" class="text-faint">No runs yet.</p>
      <p v-else-if="runs.length === 0" class="text-faint">
        {{ search ? `No run matches “${search}”` : "No runs" }}{{ days ? ` on ${formatDays(days)}` : "" }}.
        <button type="button" class="cursor-pointer text-fg hover:underline" @click="router.replace({ query: {} })">
          {{ days ? "Clear the filters" : "Clear the search" }}
        </button>
      </p>

      <div v-else class="flex items-start gap-10">
        <UiTable
          v-model:sort="sort"
          v-model:collapsed="collapsed"
          class="min-w-0 flex-1"
          :columns
          :rows="runs"
          :row-key="(row) => row.id"
          :group="byDay ? dayName : undefined"
          :active="(row) => hasPreview && row.id === previewed?.id"
          @pick="pick"
          @keydown="step"
        >
          <template #cell-select="{ row }">
            <UiCheckbox
              :model-value="selected.includes(row.id)"
              :label="`Select ${row.name}`"
              :disabled="selected.length >= 2 && !selected.includes(row.id)"
              @update:model-value="select(row.id, $event)"
              @click.stop
            />
          </template>
          <template #cell-name="{ row }">
            <RouterLink :to="`/runs/${row.id}`" data-run class="font-mono text-xs hover:underline" @focus="picked = row.id">
              {{ row.name }}
            </RouterLink>
          </template>
          <template #cell-started="{ row }">
            {{ byDay ? (row.gpsTime ? time.format(row.started) : "") : formatStarted(row) }}
          </template>
          <template #cell-duration="{ row }">{{ formatClock(row.duration, false) }}</template>
          <template #cell-sampleCount="{ row }">{{ row.sampleCount.toLocaleString() }}</template>
        </UiTable>
        <RunPreview v-if="hasPreview && previewed" :run="previewed" class="sticky top-4 w-75 flex-none" />
      </div>
    </UiPage>

    <div v-if="selected.length" class="pointer-events-none sticky bottom-4 mb-4 flex justify-center px-4">
      <div class="pointer-events-auto flex animate-pop-in items-center gap-2 rounded-2xl bg-popover py-1.5 pr-1.5 pl-4 shadow-popover">
        <b class="mr-1.5 font-semibold whitespace-nowrap">
          {{ selected.length === 1 ? "1 run selected" : `${selected.length} runs selected` }}
        </b>
        <UiButton
          variant="primary"
          :to="compareLink"
          :disabled="!compareLink"
          :title="compareLink ? undefined : 'Select a second run to compare'"
        >
          <GitCompare />Compare
        </UiButton>
        <UiIconButton label="Clear selection" @click="selected = []"><X /></UiIconButton>
      </div>
    </div>
  </div>
</template>
