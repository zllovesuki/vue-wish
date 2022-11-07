import { createRouter, createWebHistory } from "vue-router";
import HomeView from "@/views/HomeView.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: HomeView,
    },
    {
      path: "/watch",
      name: "watch",
      component: () => import("@/views/WatchView.vue"),
    },
    {
      path: "/live",
      name: "live",
      component: () => import("@/views/LiveView.vue"),
    },
    {
      path: "/:pathMatch(.*)",
      name: "not-found",
      component: () => import("@/views/404View.vue"),
    },
  ],
});

export default router;
