<script setup lang="ts" generic="Row extends object">
import type { Column } from "./types.ts";

/**
 * Rows of runs, nodes, laps or events. A cell shows `row[column.key]` unless a slot named
 * `cell-<key>` renders it: `<template #cell-name="{ row }">…</template>`. An `optional` column is
 * left out on a phone; the table scrolls sideways if the rest is still too wide.
 */
const { columns, rows, rowKey } = defineProps<{
  columns: Column[];
  rows: Row[];
  rowKey: (row: Row) => string | number;
}>();

defineSlots<Record<`cell-${string}`, (props: { row: Row }) => unknown>>();

function text(row: Row, key: string) {
  return String((row as Record<string, unknown>)[key] ?? "");
}
</script>

<template>
  <div class="overflow-x-auto">
    <table class="w-full text-left whitespace-nowrap">
      <thead>
        <tr>
          <th
            v-for="column in columns"
            :key="column.key"
            scope="col"
            class="py-2 pr-6 text-sm font-medium text-faint last:pr-0"
            :class="{ 'text-right': column.align === 'right', 'hidden sm:table-cell': column.optional }"
          >
            {{ column.label }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="rowKey(row)">
          <td
            v-for="column in columns"
            :key="column.key"
            class="border-t border-line py-2.5 pr-6 last:pr-0"
            :class="{ 'num text-right': column.align === 'right', 'hidden sm:table-cell': column.optional }"
          >
            <slot :name="`cell-${column.key}`" :row>{{ text(row, column.key) }}</slot>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
