/**
 * The state behind a status lamp. A node's state maps to it: sending is `ok`, waiting is `warn`,
 * offline is `crit`, disabled is `off`.
 */
export type Tone = "ok" | "warn" | "crit" | "info" | "off";

export type Option<T extends string = string> = { label: string; value: T };

/** An entry of a menu: an action, or a line between groups. */
export type MenuItem = { label: string; hint?: string; select: () => void } | "separator";
