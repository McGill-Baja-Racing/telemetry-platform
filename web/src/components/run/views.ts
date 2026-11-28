import { useLocalStorage } from "@vueuse/core";
import { computed } from "vue";
import type { ChartSettings } from "../chart/types.ts";

/** The signals the run's charts show, and how each chart is drawn, by its title. */
export type View = { signals: string[]; charts: Record<string, ChartSettings> };

const brakes = ["front_brake_pressure", "rear_brake_pressure"];
const acceleration = ["mpu_accel_x", "mpu_accel_y", "mpu_accel_z"];
const imu = [...acceleration, "mpu_gyro_x", "mpu_gyro_y", "mpu_gyro_z"];

/** What each view shows until someone changes it: only signals the car sends. */
const firstShown: Record<string, string[]> = {
  "My view": ["gps_speed", "engine_rpm", ...brakes, ...acceleration],
  Suspension: [...imu, "gps_speed", ...brakes],
  Powertrain: ["engine_rpm", "bearing_rpm", "gps_speed"],
  Brakes: [...brakes, "mpu_accel_x", "gps_speed"],
  Drivers: ["gps_speed", "engine_rpm", ...brakes],
  Chassis: imu,
};

export const viewNames = Object.keys(firstShown);

/** A view per team and one of your own, kept in this browser until there are accounts (#13). */
export function useRunViews() {
  const views = useLocalStorage<Record<string, View>>(
    "run-views",
    Object.fromEntries(viewNames.map((name) => [name, { signals: firstShown[name], charts: {} }])),
    { mergeDefaults: true },
  );
  const name = useLocalStorage("run-view", viewNames[0]);
  const view = computed(() => views.value[name.value] ?? views.value[viewNames[0]]);
  return { name, view };
}
