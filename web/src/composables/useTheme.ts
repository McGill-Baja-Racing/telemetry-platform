import { Moon, Sun, SunMoon } from "@lucide/vue";
import { createSharedComposable, useColorMode } from "@vueuse/core";

/** In the order the phone's theme button goes through them. */
export const themes = [
  { label: "Auto", value: "auto", icon: SunMoon },
  { label: "Light", value: "light", icon: Sun },
  { label: "Dark", value: "dark", icon: Moon },
] as const;

/**
 * The colour theme, one for the whole app. `store` is the choice, saved in the browser, and `state`
 * the theme in use. The script in index.html applies the same choice before the app loads.
 */
export const useTheme = createSharedComposable(() =>
  useColorMode({ attribute: "data-theme", storageKey: "theme" }),
);
