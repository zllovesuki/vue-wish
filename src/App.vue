<script setup lang="ts">
import "@/assets/main.css";
import Nav from "@/components/NavBar.vue";
import Footer from "@/components/FooterSection.vue";
import { XMarkIcon } from "@heroicons/vue/20/solid";
import { RouterView } from "vue-router";

import { useNotificationStore } from "@/store/notification";

const notification = useNotificationStore();
</script>

<template>
  <div class="min-h-full">
    <Nav />
    <main class="py-10 dark:bg-slate-900">
      <div class="mx-auto max-w-screen-2xl sm:px-6 lg:px-8">
        <RouterView />
      </div>
    </main>
    <Footer />
    <div
      aria-live="assertive"
      class="pointer-events-none fixed inset-0 flex items-end px-4 py-6 sm:items-start sm:p-6"
    >
      <div class="flex w-full flex-col items-center space-y-4 sm:items-end">
        <transition
          enter-active-class="transform ease-out duration-300 transition"
          enter-from-class="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
          enter-to-class="translate-y-0 opacity-100 sm:translate-x-0"
          leave-active-class="transition ease-in duration-100"
          leave-from-class="opacity-100"
          leave-to-class="opacity-0"
        >
          <div
            v-if="notification.show"
            class="pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg bg-white dark:bg-slate-700 shadow-lg ring-1 ring-black ring-opacity-5"
          >
            <div class="p-4">
              <div class="flex items-center">
                <div class="flex w-0 flex-1 justify-between">
                  <p
                    class="w-0 flex-1 text-sm font-medium text-gray-900 dark:text-gray-200"
                  >
                    {{ notification.message }}
                  </p>
                </div>
                <div class="ml-4 flex flex-shrink-0">
                  <button
                    type="button"
                    @click="notification.show = false"
                    class="inline-flex rounded-md bg-white dark:bg-slate-700 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  >
                    <span class="sr-only">Close</span>
                    <XMarkIcon class="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>
