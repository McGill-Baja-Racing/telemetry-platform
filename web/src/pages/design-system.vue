<script setup lang="ts">
import { Download, Ellipsis, Flag, Search, Square } from "@lucide/vue";
import { ref } from "vue";
import LineChart from "../components/chart/LineChart.vue";
import CarBar, { type CarState } from "../components/shell/CarBar.vue";
import type { MenuItem, Tone } from "../components/ui/types.ts";
import UiButton from "../components/ui/UiButton.vue";
import UiChip from "../components/ui/UiChip.vue";
import UiFigures from "../components/ui/UiFigures.vue";
import UiFormRow from "../components/ui/UiFormRow.vue";
import UiIconButton from "../components/ui/UiIconButton.vue";
import UiIssue from "../components/ui/UiIssue.vue";
import UiKbd from "../components/ui/UiKbd.vue";
import UiKeyValues from "../components/ui/UiKeyValues.vue";
import UiMenu from "../components/ui/UiMenu.vue";
import UiPage from "../components/ui/UiPage.vue";
import UiProgress from "../components/ui/UiProgress.vue";
import UiSection from "../components/ui/UiSection.vue";
import UiSegmented from "../components/ui/UiSegmented.vue";
import UiSelect from "../components/ui/UiSelect.vue";
import UiSignalToggle from "../components/ui/UiSignalToggle.vue";
import UiStatus from "../components/ui/UiStatus.vue";
import UiTable from "../components/ui/UiTable.vue";
import UiTabs from "../components/ui/UiTabs.vue";
import UiTag from "../components/ui/UiTag.vue";
import UiTextField from "../components/ui/UiTextField.vue";

const colors = [
  { group: "Surfaces", tokens: ["chrome", "screen", "raised", "sunk", "popover"] },
  { group: "Text", tokens: ["fg", "muted", "faint", "ink", "live"] },
  { group: "Status", tokens: ["ok", "warn", "crit", "info"] },
  { group: "Signals", tokens: ["axis-x", "axis-y", "axis-z", "gearbox", "rear-brake"] },
  {
    group: "Teams",
    tokens: ["suspension", "powertrain", "brakes", "drivers", "electronics", "chassis"],
  },
];

const tones: { tone: Tone; label: string }[] = [
  { tone: "ok", label: "Sending" },
  { tone: "warn", label: "Waiting" },
  { tone: "crit", label: "Offline" },
  { tone: "off", label: "Disabled" },
];

const window = ref("30");
const run = ref<string>();
const signal = ref("");
const mine = ref(true);
const powertrain = ref(false);
const tab = ref("nodes");
const shown = ref({ x: true, y: true, z: true, speed: false });

const menu: MenuItem[] = [
  { label: "Y axis", hint: "Auto", select: () => {} },
  { label: "Set min and max", select: () => {} },
  "separator",
  { label: "Remove from the view", select: () => {} },
];

const nodes = [
  { name: "Brake node", id: "Node 1", rate: "100 Hz", tone: "ok" as const, state: "Sending" },
  { name: "IMU node", id: "Node 3", rate: "100 Hz", tone: "ok" as const, state: "Sending" },
  { name: "Engine node", id: "Node 5", rate: "Each spark", tone: "warn" as const, state: "Waiting" },
  { name: "Analog input node", id: "Node 6", rate: "100 Hz", tone: "off" as const, state: "Disabled" },
];

const states: { state: CarState; detail?: string }[] = [
  { state: "recording", detail: "Endurance loop, second stint, 5:03" },
  { state: "starting" },
  { state: "idle", detail: "Last recording stopped at 14:45" },
  { state: "reconnecting", detail: "No data for 6 s" },
  { state: "offline", detail: "Last seen at 17:12" },
  { state: "connected", detail: "Logs are collected automatically" },
];
const barValues = [
  { label: "GPS speed", value: "48.4", unit: "km/h" },
  { label: "Engine", value: "3,626", unit: "rpm" },
  { label: "Front brake", value: "0", unit: "psi" },
];
const noop = () => {};

const time = Array.from({ length: 600 }, (_, i) => 500 + i / 10);
const wave = (phase: number, scale: number) =>
  time.map((t, i) => (i > 380 && i < 400 ? null : Math.sin(t * 1.7 + phase) * scale + Math.sin(t * 7) * 0.2));
const acceleration = [
  { label: "X", color: "axis-x", values: wave(0, 0.6) },
  { label: "Y", color: "axis-y", values: wave(2, 0.4) },
  { label: "Z", color: "axis-z", values: wave(4, 1.1).map((v) => (v === null ? null : v + 1)) },
];
const speed = [
  { label: "GPS speed", color: "drivers", values: time.map((t) => 38 + Math.sin(t / 4) * 9) },
];
</script>

<template>
  <UiPage title="Design system">
    <p class="max-w-prose text-muted sm:-mt-6">
      Every page is built from these parts. Their code is in <code class="font-mono text-xs">web/src/components</code>,
      and the colours and type sizes in <code class="font-mono text-xs">web/src/style.css</code>.
    </p>

    <UiSection title="Colours">
      <div class="grid grid-cols-1 gap-6">
        <div v-for="row in colors" :key="row.group" class="grid gap-2">
          <h3 class="text-sm text-muted">{{ row.group }}</h3>
          <div class="grid grid-cols-2 gap-2 sm:grid-cols-6">
            <div v-for="token in row.tokens" :key="token" class="grid gap-1.5">
              <span
                class="h-11 rounded-lg inset-ring inset-ring-line-strong"
                :style="{ background: `var(--color-${token})` }"
              />
              <code class="font-mono text-xs text-faint">{{ token }}</code>
            </div>
          </div>
        </div>
      </div>
    </UiSection>

    <UiSection title="Type">
      <div class="grid grid-cols-1 divide-y divide-line">
        <div class="py-4"><h1>Endurance loop</h1></div>
        <div class="py-4"><h2>Today's runs</h2></div>
        <div class="py-4"><h3>Acceleration</h3></div>
        <p class="py-4">Hard landing off the jump: 3.4 g on acceleration Z.</p>
        <p class="num py-4 text-4xl font-semibold">48.4 km/h 3,626 rpm 1:29.5</p>
        <p class="py-4 font-mono text-xs">endurance_loop.bin mpu_accel_z</p>
      </div>
    </UiSection>

    <UiSection title="Controls">
      <div class="flex flex-wrap items-center gap-2.5">
        <UiButton variant="primary">Open run</UiButton>
        <UiButton><Download />Export</UiButton>
        <UiButton variant="quiet">Cancel</UiButton>
        <UiButton variant="live" shortcut="M"><Flag />Mark moment</UiButton>
        <UiButton size="sm">Small</UiButton>
        <UiMenu :items="menu">
          <UiIconButton label="Chart options"><Ellipsis /></UiIconButton>
        </UiMenu>
      </div>
      <div class="flex flex-wrap items-center gap-2.5">
        <UiSelect
          v-model="run"
          label="Run"
          placeholder="Choose"
          :options="[
            { label: 'Endurance loop', value: 'endurance' },
            { label: 'Hill climb', value: 'hill' },
          ]"
        />
        <UiTextField v-model="signal" type="search" label="Add a signal" placeholder="Add a signal" class="w-56">
          <Search />
        </UiTextField>
        <UiSegmented
          v-model="window"
          label="Window"
          :options="[
            { label: '10 s', value: '10' },
            { label: '30 s', value: '30' },
            { label: '60 s', value: '60' },
          ]"
        />
      </div>
      <div class="flex flex-wrap items-center gap-2.5">
        <UiChip v-model="mine">My team</UiChip>
        <UiChip v-model="powertrain" color="powertrain">Powertrain</UiChip>
        <UiTag>Setup B</UiTag>
        <UiTag color="suspension">Suspension</UiTag>
        <UiKbd>⌘K</UiKbd>
        <UiProgress :value="0.66" label="Download" class="w-32" />
      </div>
      <UiFormRow label="Name" help="Letters, digits, _ or -, up to 40." class="max-w-80">
        <UiTextField placeholder="endurance_loop" />
      </UiFormRow>
    </UiSection>

    <UiSection title="Status and issues">
      <div class="flex flex-wrap gap-6">
        <UiStatus v-for="item in tones" :key="item.tone" :tone="item.tone">{{ item.label }}</UiStatus>
      </div>
      <div class="divide-y divide-line">
        <UiIssue
          title="Engine node is waiting"
          effect="No engine speed in this run since 14:41."
          cause="Usually the spark sensor wire."
        >
          <UiButton size="sm">Diagnostics</UiButton>
        </UiIssue>
      </div>
    </UiSection>

    <UiSection title="Values">
      <UiFigures
        :items="[
          { label: 'Best lap', value: '1:29.5' },
          { label: 'Top speed', value: '48.4', unit: 'km/h' },
          { label: 'Peak engine speed', value: '3,626', unit: 'rpm' },
          { label: 'Peak acceleration Z', value: '3.42', unit: 'g' },
        ]"
      />
      <UiKeyValues
        class="max-w-96"
        :items="[
          { label: 'CAN drops', value: '0' },
          { label: 'Log drops', value: '3' },
          { label: 'File size', value: '54.5', unit: 'MB' },
        ]"
      />
    </UiSection>

    <UiSection title="Tabs and tables">
      <UiTabs
        v-model="tab"
        :tabs="[
          { label: 'Nodes', value: 'nodes', count: nodes.length },
          { label: 'Counters', value: 'counters' },
        ]"
      >
        <template #nodes>
          <UiTable
            :columns="[
              { key: 'name', label: 'Node' },
              { key: 'id', label: 'Id', optional: true },
              { key: 'rate', label: 'Rate', align: 'right' },
              { key: 'state', label: 'State' },
            ]"
            :rows="nodes"
            :row-key="(row) => row.id"
          >
            <template #cell-state="{ row }">
              <UiStatus :tone="row.tone">{{ row.state }}</UiStatus>
            </template>
          </UiTable>
        </template>
        <template #counters>
          <UiKeyValues :items="[{ label: 'CAN receive errors', value: '0' }]" class="max-w-96" />
        </template>
      </UiTabs>
    </UiSection>

    <UiSection title="Charts, with example data">
      <div class="flex flex-col gap-8 lg:flex-row">
        <div class="grid min-w-0 flex-1 gap-8">
          <LineChart
            v-if="shown.x || shown.y || shown.z"
            title="Acceleration"
            unit="g"
            :time
            :series="acceleration.filter((_, i) => [shown.x, shown.y, shown.z][i])"
            :digits="2"
            sync="example"
            :menu
          />
          <LineChart v-if="shown.speed" title="GPS speed" unit="km/h" :time :series="speed" :digits="1" sync="example" />
        </div>
        <div class="lg:w-50">
          <UiSignalToggle v-model="shown.x" color="axis-x" name="Acceleration X" unit="g" />
          <UiSignalToggle v-model="shown.y" color="axis-y" name="Acceleration Y" unit="g" />
          <UiSignalToggle v-model="shown.z" color="axis-z" name="Acceleration Z" unit="g" />
          <UiSignalToggle v-model="shown.speed" color="drivers" name="GPS speed" unit="km/h" />
        </div>
      </div>
    </UiSection>

    <UiSection title="Buttons on a phone">
      <div class="flex max-w-96 gap-2">
        <UiButton size="lg"><Square />Stop</UiButton>
        <UiButton size="lg" variant="live" class="flex-1"><Flag />Mark this moment</UiButton>
      </div>
    </UiSection>

    <UiSection title="Car bar on a phone">
      <div class="grid max-w-96 gap-2.5">
        <CarBar
          v-for="item in states"
          :key="item.state"
          layout="small"
          class="-mx-2.5"
          number="57"
          :state="item.state"
          :detail="item.detail"
          :values="barValues"
        />
      </div>
    </UiSection>

    <UiSection title="Car bar">
      <div class="grid gap-2.5 overflow-hidden rounded-xl">
        <CarBar
          v-for="item in states"
          :key="item.state"
          layout="full"
          number="57"
          :state="item.state"
          :detail="item.detail"
          :values="barValues"
          :warnings="1"
          @start="noop"
          @stop="noop"
          @mark="noop"
          @cancel="noop"
          @retry="noop"
          @import="noop"
          @warnings="noop"
        />
      </div>
    </UiSection>
  </UiPage>
</template>
