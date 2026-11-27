/** `connected` is for when the app reaches the car without knowing whether it records. */
export type CarState = "recording" | "starting" | "idle" | "reconnecting" | "offline" | "connected";

export type CarValue = { label: string; value: string; unit?: string };
