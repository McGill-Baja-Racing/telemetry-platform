<script setup lang="ts" generic="Row extends object">
import { ArrowDown, ArrowUp, ChevronDown } from "@lucide/vue";
import { computed } from "vue";
import { cellOf, groupRows } from "./table.ts";
import type { Column, Sort } from "./types.ts";

/**
 * Rows of runs, nodes, laps or events. A cell shows `row[column.key]` unless a slot named
 * `cell-<key>` renders it: `<template #cell-name="{ row }">…</template>`. An `optional` column is
 * left out on a phone; the table scrolls sideways if the rest is still too wide.
 *
 * Clicking a `sortable` column sorts the rows by `row[column.key]` into `v-model:sort`. `group`
 * names the group of each row: neighbours with the same name share a heading. With
 * `v-model:collapsed`, a heading opens and closes its group, and the model lists the closed ones.
 * `active` marks the row shown elsewhere, such as in a preview, and makes rows emit `pick` when
 * clicked.
 */
const { columns, rows, rowKey, group, active } = defineProps<{
  columns: Column[];
  rows: Row[];
  rowKey: (row: Row) => string | number;
  group?: (row: Row) => string;
  active?: (row: Row) => boolean;
}>();
const sort = defineModel<Sort>("sort");
const collapsed = defineModel<string[]>("collapsed");
const emit = defineEmits<{ pick: [row: Row] }>();

defineSlots<Record<`cell-${string}`, (props: { row: Row }) => unknown>>();

const groups = computed(() =>
  groupRows(rows, sort.value, group).map((part) => ({
    ...part,
    open: !collapsed.value?.includes(part.name),
  })),
);

function toggle(name: string, open: boolean) {
  const others = (collapsed.value ?? []).filter((other) => other !== name);
  collapsed.value = open ? [...others, name] : others;
}

/** Numbers, such as dates and durations, sort largest first; text sorts from A. */
function sortBy(key: string) {
  const first = rows[0];
  const descending =
    sort.value?.key === key
      ? !sort.value.descending
      : first !== undefined && typeof cellOf(first, key) === "number";
  sort.value = { key, descending };
}

function ariaSort(key: string) {
  if (sort.value?.key !== key) return undefined;
  return sort.value.descending ? "descending" : "ascending";
}

/**
 * Picked rows have a background, so cells keep room inside it on both sides. Every cell pads its
 * left, since an optional first column can be hidden.
 */
const padding = computed(() => (active ? "pl-2.5 pr-3.5 last:pr-2.5" : "pr-6 last:pr-0"));
</script>

<template>
  <div class="overflow-x-auto" :class="{ '-mx-2.5': active }">
    <table class="w-full text-left whitespace-nowrap">
      <thead>
        <tr>
          <th
            v-for="column in columns"
            :key="column.key"
            scope="col"
            :aria-sort="ariaSort(column.key)"
            class="py-2 text-sm font-medium text-faint"
            :class="[padding, { 'text-right': column.align === 'right', 'hidden sm:table-cell': column.optional }]"
          >
            <button
              v-if="column.sortable"
              type="button"
              class="inline-flex cursor-pointer items-center gap-1 transition hover:text-fg"
              :class="{ 'text-fg': sort?.key === column.key }"
              @click="sortBy(column.key)"
            >
              {{ column.label }}
              <template v-if="sort?.key === column.key">
                <ArrowDown v-if="sort.descending" class="size-3.5" />
                <ArrowUp v-else class="size-3.5" />
              </template>
            </button>
            <template v-else>{{ column.label }}</template>
          </th>
        </tr>
      </thead>
      <tbody v-for="part in groups" :key="part.name">
        <tr v-if="part.name">
          <th :colspan="columns.length" scope="rowgroup" class="pt-7.5 pb-2.5 font-semibold" :class="{ 'pl-2.5': active }">
            <button
              v-if="collapsed"
              type="button"
              :aria-expanded="part.open"
              class="-my-1 flex w-full cursor-pointer items-center gap-1.5 py-1 text-left pointer-coarse:-my-3 pointer-coarse:py-3"
              @click="toggle(part.name, part.open)"
            >
              {{ part.name }}
              <ChevronDown class="size-3.5 text-faint transition-transform" :class="{ '-rotate-90': !part.open }" />
              <span v-if="!part.open" class="num font-normal text-faint">{{ part.rows.length }}</span>
            </button>
            <template v-else>{{ part.name }}</template>
          </th>
        </tr>
        <tr
          v-for="row in part.open ? part.rows : []"
          :key="rowKey(row)"
          :class="{ 'group cursor-pointer': active }"
          :aria-current="active?.(row) || undefined"
          @click="active && emit('pick', row)"
        >
          <td
            v-for="column in columns"
            :key="column.key"
            class="border-t border-line py-2.5 first:rounded-l-md last:rounded-r-md"
            :class="[
              padding,
              {
                'num text-right': column.align === 'right',
                'hidden sm:table-cell': column.optional,
                'border-transparent bg-selected': active?.(row),
                'group-hover:bg-hover': active && !active(row),
              },
            ]"
          >
            <slot :name="`cell-${column.key}`" :row>{{ cellOf(row, column.key) ?? "" }}</slot>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
