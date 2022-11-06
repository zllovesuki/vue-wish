import { ref } from "vue";
import { defineStore } from "pinia";

export const useNotificationStore = defineStore("notification", () => {
  const show = ref(false);
  const message = ref("");

  return {
    show,
    message,
  };
});
