import { useColorMode } from "@vueuse/core";

/**
 * The colour theme. `store` is the choice ("auto", "light" or "dark", saved in the browser) and
 * `state` the theme in use. The script in index.html applies the same choice before the app loads.
 */
export function useTheme() {
  return useColorMode({ attribute: "data-theme", storageKey: "theme" });
}
