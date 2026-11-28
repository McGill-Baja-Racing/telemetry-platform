<script setup lang="ts">
import { getLocalTimeZone, parseDate, today } from "@internationalized/date";
import { ChevronLeft, ChevronRight } from "@lucide/vue";
import {
  type DateRange,
  PopoverContent,
  PopoverPortal,
  PopoverRoot,
  PopoverTrigger,
  RangeCalendarCell,
  RangeCalendarCellTrigger,
  RangeCalendarGrid,
  RangeCalendarGridBody,
  RangeCalendarGridHead,
  RangeCalendarGridRow,
  RangeCalendarHeadCell,
  RangeCalendarHeader,
  RangeCalendarHeading,
  RangeCalendarNext,
  RangeCalendarPrev,
  RangeCalendarRoot,
} from "reka-ui";
import { computed, ref } from "vue";
import { formatDays } from "../../format.ts";
import type { DayRange } from "./types.ts";
import UiButton from "./UiButton.vue";
import UiIconButton from "./UiIconButton.vue";
import UiPickerButton from "./UiPickerButton.vue";

/**
 * Picks one day or a range of days on a calendar. A click picks that day at once; a click on
 * another day makes the range and closes the calendar. `marked` lists the days that have
 * something, such as runs, oldest first: they stand out, and the calendar opens on the last one.
 */
const { label, marked = [] } = defineProps<{ label: string; marked?: string[] }>();
const model = defineModel<DayRange | null>({ default: null });

const open = ref(false);
const locale = navigator.language;
const has = computed(() => new Set(marked));

/** Read when the calendar opens: it then keeps its own picking state until it closes. */
const picked = computed(() =>
  model.value ? { start: parseDate(model.value[0]), end: parseDate(model.value[1]) } : undefined,
);
const shown = computed(() => {
  const last = marked.at(-1);
  return picked.value?.start ?? (last ? parseDate(last) : today(getLocalTimeZone()));
});

function pick({ start, end }: DateRange) {
  model.value = start ? [start.toString(), (end ?? start).toString()] : null;
  if (end) open.value = false;
}

function clear() {
  model.value = null;
  open.value = false;
}
</script>

<template>
  <PopoverRoot v-model:open="open">
    <PopoverTrigger as-child>
      <UiPickerButton :label>
        <span :class="{ 'font-normal text-faint': !model }">{{ model ? formatDays(model) : "Any day" }}</span>
      </UiPickerButton>
    </PopoverTrigger>
    <PopoverPortal>
      <!-- Escape closes and keeps the day just picked: the calendar alone would take it back. -->
      <PopoverContent
        align="start"
        :side-offset="6"
        class="popover grid origin-(--reka-popover-content-transform-origin) justify-items-start gap-2 p-3"
        @open-auto-focus.prevent
        @keydown.esc.capture.stop="open = false"
      >
        <RangeCalendarRoot
          v-slot="{ grid, weekDays }"
          :default-value="picked"
          :default-placeholder="shown"
          :locale
          :calendar-label="label"
          fixed-weeks
          initial-focus
          @update:model-value="pick"
        >
          <RangeCalendarHeader class="flex items-center justify-between pb-2">
            <RangeCalendarPrev as-child>
              <UiIconButton label="Previous month"><ChevronLeft /></UiIconButton>
            </RangeCalendarPrev>
            <RangeCalendarHeading class="font-semibold" />
            <RangeCalendarNext as-child>
              <UiIconButton label="Next month"><ChevronRight /></UiIconButton>
            </RangeCalendarNext>
          </RangeCalendarHeader>
          <RangeCalendarGrid v-for="month in grid" :key="month.value.toString()">
            <RangeCalendarGridHead>
              <RangeCalendarGridRow>
                <RangeCalendarHeadCell v-for="day in weekDays" :key="day" class="pb-1 text-sm font-normal text-faint">
                  {{ day }}
                </RangeCalendarHeadCell>
              </RangeCalendarGridRow>
            </RangeCalendarGridHead>
            <RangeCalendarGridBody>
              <RangeCalendarGridRow v-for="(week, index) in month.rows" :key="index">
                <RangeCalendarCell
                  v-for="day in week"
                  :key="day.toString()"
                  :date="day"
                  class="py-px has-data-highlighted:bg-hover has-data-highlighted-end:rounded-r-md has-data-highlighted-start:rounded-l-md has-data-selected:bg-selected has-data-selection-end:rounded-r-md has-data-selection-start:rounded-l-md"
                >
                  <RangeCalendarCellTrigger
                    :day
                    :month="month.value"
                    class="num grid size-8 cursor-pointer place-items-center rounded-md outline-offset-0 transition-colors hover:bg-hover data-outside-view:not-data-selected:opacity-40 data-selection-end:bg-ink data-selection-end:text-on-ink data-selection-start:bg-ink data-selection-start:text-on-ink data-today:inset-ring data-today:inset-ring-line-strong pointer-coarse:size-11"
                    :class="has.has(day.toString()) ? 'font-semibold' : 'text-faint'"
                  />
                </RangeCalendarCell>
              </RangeCalendarGridRow>
            </RangeCalendarGridBody>
          </RangeCalendarGrid>
        </RangeCalendarRoot>
        <UiButton v-if="model" variant="quiet" size="sm" class="-mb-1 -ml-1" @click="clear">Clear</UiButton>
      </PopoverContent>
    </PopoverPortal>
  </PopoverRoot>
</template>
