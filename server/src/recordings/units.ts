/**
 * Signals the master logs as scaled integers, by CAN ID: their value divided by `divisor` is in
 * `units`. Samples are stored as logged and converted when read. GPS speed is the exception: the
 * import already stores it in km/h, and changing that would mean rewriting every recording.
 */
const conversions = new Map<number, { divisor: number; units: string }>([
  [0x0b3, { divisor: 1000, units: "g" }], // mpu_accel_x
  [0x0b4, { divisor: 1000, units: "g" }], // mpu_accel_y
  [0x0b5, { divisor: 1000, units: "g" }], // mpu_accel_z
  [0x0b6, { divisor: 1000, units: "°/s" }], // mpu_gyro_x
  [0x0b7, { divisor: 1000, units: "°/s" }], // mpu_gyro_y
  [0x0b8, { divisor: 1000, units: "°/s" }], // mpu_gyro_z
  [0x701, { divisor: 1e7, units: "°" }], // gps_latitude
  [0x702, { divisor: 1e7, units: "°" }], // gps_longitude
]);

export function divisorOf(canId: number) {
  return conversions.get(canId)?.divisor ?? 1;
}

/** `logged` is the unit the master names, such as "mg". */
export function unitsOf(canId: number, logged: string) {
  return conversions.get(canId)?.units ?? logged;
}
