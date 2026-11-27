/**
 * How the app shows the signals the car sends; the server already gives their values in physical
 * units. Signals with the same `chart` share one chart. A signal missing here is shown under its
 * own name.
 */
type Style = { label: string; short: string; color: string; chart: string; digits?: number };

const styles: Record<string, Style> = {
  mpu_accel_x: {
    label: "Acceleration X",
    short: "X",
    color: "axis-x",
    chart: "Acceleration",
    digits: 2,
  },
  mpu_accel_y: {
    label: "Acceleration Y",
    short: "Y",
    color: "axis-y",
    chart: "Acceleration",
    digits: 2,
  },
  mpu_accel_z: {
    label: "Acceleration Z",
    short: "Z",
    color: "axis-z",
    chart: "Acceleration",
    digits: 2,
  },
  mpu_gyro_x: { label: "Rotation rate X", short: "X", color: "axis-x", chart: "Rotation rate" },
  mpu_gyro_y: { label: "Rotation rate Y", short: "Y", color: "axis-y", chart: "Rotation rate" },
  mpu_gyro_z: { label: "Rotation rate Z", short: "Z", color: "axis-z", chart: "Rotation rate" },
  front_brake_pressure: {
    label: "Front brake pressure",
    short: "Front",
    color: "brakes",
    chart: "Brake pressure",
  },
  rear_brake_pressure: {
    label: "Rear brake pressure",
    short: "Rear",
    color: "rear-brake",
    chart: "Brake pressure",
  },
  engine_rpm: {
    label: "Engine speed",
    short: "Engine",
    color: "powertrain",
    chart: "Engine speed",
  },
  bearing_rpm: {
    label: "Gearbox bearing",
    short: "Bearing",
    color: "gearbox",
    chart: "Gearbox bearing",
  },
  gps_speed: {
    label: "GPS speed",
    short: "Speed",
    color: "drivers",
    chart: "GPS speed",
    digits: 1,
  },
};

const nodes: Record<string, string> = {
  mpu_node_3: "IMU node",
  brake_node_1: "Brake node",
  engine_node_5: "Engine node",
  encoder_node_4: "Encoder node",
  master_gps: "Logger, GPS",
  adc_node_6: "ADC node",
};

/** GPS position goes on the map, and a spark event is always 1. */
const notCharted = ["gps_latitude", "gps_longitude", "engine_spark"];

const spareColors = ["chassis", "electronics", "info", "suspension"];

export type Signal = Required<Style> & { name: string; node: string; unit: string };

/** The signals that can be charted, grouped by the node that sends them. */
export function chartableSignals(signals: { name: string; node: string; units: string }[]) {
  const list = signals
    .filter((signal) => !notCharted.includes(signal.name))
    .map((signal, index): Signal => {
      const label = signal.name.replaceAll("_", " ").replace(/^./, (first) => first.toUpperCase());
      const style = styles[signal.name] ?? {
        label,
        short: label,
        color: spareColors[index % spareColors.length],
        chart: label,
      };
      return {
        digits: 0,
        ...style,
        name: signal.name,
        node: nodes[signal.node] ?? signal.node,
        unit: signal.units,
      };
    });
  return Map.groupBy(list, (signal) => signal.node);
}
