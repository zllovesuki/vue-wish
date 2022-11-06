import { ref } from "vue";
import { defineStore } from "pinia";

export const useSettingStore = defineStore("setting", () => {
  const trickle = ref(false);

  return {
    trickle,
  };
});
