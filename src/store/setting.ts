import { ref } from "vue";
import { defineStore } from "pinia";

export const useSettingStore = defineStore(
  "setting",
  () => {
    let dark = false;
    if (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      dark = true;
    }
    const trickle = ref(true);
    const darkMode = ref(dark);

    const lastLive = ref("");

    return {
      trickle,
      darkMode,
      lastLive,
    };
  },
  {
    persist: true,
  }
);
