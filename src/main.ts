window.global ||= window;
import { createApp, watchEffect, h } from "vue";
import { createPinia } from "pinia";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";
import { useSettingStore } from "./store/setting";

import App from "./App.vue";
import router from "./router";

const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

const app = createApp({
  setup() {
    const setting = useSettingStore();
    const applyDarkMode = () =>
      document.documentElement.classList[setting.darkMode ? "add" : "remove"](
        "dark"
      );
    watchEffect(applyDarkMode);
  },
  render: () => h(App),
});

app.use(router);
app.use(pinia);

app.mount("#app");
