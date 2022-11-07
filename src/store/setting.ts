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
    const trickle = ref(false);
    const darkMode = ref(dark);

    return {
      trickle,
      darkMode,
    };
  },
  {
    persist: true,
  }
);
