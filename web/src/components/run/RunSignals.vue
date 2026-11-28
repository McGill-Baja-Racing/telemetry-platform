<script setup lang="ts">
import { Search } from "@lucide/vue";
import { computed, ref } from "vue";
import type { Signal } from "../../signals.ts";
import UiSelect from "../ui/UiSelect.vue";
import UiSignalToggle from "../ui/UiSignalToggle.vue";
import UiTextField from "../ui/UiTextField.vue";
import { viewNames } from "./views.ts";

/**
 * The view to show, then the run's signals by node to show or hide. Typing filters them, and Enter
 * shows the first one found.
 */
const { groups } = defineProps<{ groups: Map<string, Signal[]> }>();
const view = defineModel<string>("view", { required: true });
const shown = defineModel<string[]>("shown", { required: true });

const options = viewNames.map((name) => ({ label: name, value: name }));
const query = ref("");

const found = computed(() => {
  const words = query.value.trim().toLowerCase();
  const matching = [...groups.values()]
    .flat()
    .filter((signal) => `${signal.label} ${signal.name}`.toLowerCase().includes(words));
  return Map.groupBy(matching, (signal) => signal.node);
});

function show(name: string, on: boolean) {
  shown.value = on ? [...shown.value, name] : shown.value.filter((n) => n !== name);
}

function showFirst() {
  const first = [...found.value.values()].flat().find((signal) => !shown.value.includes(signal.name));
  if (first) show(first.name, true);
  query.value = "";
}
</script>

<template>
  <aside class="grid gap-0.5" aria-label="Signals">
    <UiSelect v-model="view" label="View" :options />
    <UiTextField
      v-model="query"
      type="search"
      label="Add a signal"
      placeholder="Add a signal"
      class="mt-2"
      @keydown.enter="showFirst"
    >
      <Search />
    </UiTextField>
    <template v-for="[node, list] in found" :key="node">
      <h3 class="px-2 pt-4 pb-1 text-sm text-faint">{{ node }}</h3>
      <UiSignalToggle
        v-for="signal in list"
        :key="signal.name"
        :model-value="shown.includes(signal.name)"
        :color="signal.color"
        :name="signal.label"
        :unit="signal.unit"
        @update:model-value="show(signal.name, $event)"
      />
    </template>
    <p v-if="found.size === 0" class="px-2 pt-4 text-sm text-faint">No signal matches.</p>
  </aside>
</template>
