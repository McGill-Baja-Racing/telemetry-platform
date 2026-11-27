import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { mainNav, type NavItem, teamNav } from "../navigation.ts";

/** The navigation entries whose page exists, and whether an entry is the current page. */
export function useNavigation() {
  const router = useRouter();
  const route = useRoute();

  const exists = (item: NavItem) => {
    const record = router.resolve(item.to).matched.at(-1);
    return record !== undefined && !record.redirect;
  };

  return {
    main: computed(() => mainNav.filter(exists)),
    teams: computed(() => teamNav.filter(exists)),
    phone: computed(() => mainNav.filter((item) => item.phone && exists(item))),
    isActive: (item: NavItem) =>
      route.path === item.to || (item.to !== "/" && route.path.startsWith(`${item.to}/`)),
  };
}
