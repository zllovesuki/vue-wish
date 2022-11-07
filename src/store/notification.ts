import { ref } from "vue";
import { defineStore } from "pinia";

export const useNotificationStore = defineStore("notification", () => {
  const show = ref(false);
  const message = ref("");

  const notify = (msg: string) => {
    message.value = msg;
    show.value = true;
  };

  return {
    show,
    message,
    notify,
  };
});
