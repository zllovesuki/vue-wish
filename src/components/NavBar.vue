<script setup lang="ts">
import { useSettingStore } from "@/store/setting";
import { Disclosure, DisclosureButton, DisclosurePanel } from "@headlessui/vue";
import { SunIcon, MoonIcon } from "@heroicons/vue/20/solid";
import { Bars3Icon, XMarkIcon } from "@heroicons/vue/24/outline";
import { ref } from "vue";
import { RouterLink } from "vue-router";
import { useRoute, useRouter } from "vue-router";

const setting = useSettingStore();

const route = useRoute();
const router = useRouter();
const navigation = ref([
  {
    name: "Home",
    to: "home",
  },
  {
    name: "Watch",
    to: "watch",
  },
  {
    name: "Go Live!",
    to: "live",
  },
]);
</script>

<template>
  <Disclosure
    as="nav"
    class="bg-white dark:bg-slate-800 shadow-sm"
    v-slot="{ open }"
  >
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="flex h-16 items-center justify-between">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <svg
              width="32px"
              height="32px"
              viewBox="0 0 24 24"
              role="img"
              class="fill-black dark:fill-white"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M11.9998.3598c-2.8272 0-5.1456 2.1733-5.3793 4.94a5.4117 5.4117 0 00-1.2207-.1401C2.418 5.1597 0 7.5779 0 10.5603c0 2.2203 1.341 4.1274 3.2568 4.957a5.3734 5.3734 0 00-.7372 2.7227c0 2.9823 2.4175 5.4002 5.4002 5.4002 1.6627 0 3.1492-.7522 4.1397-1.934.9906 1.1818 2.4773 1.934 4.1398 1.934 2.983 0 5.4004-2.418 5.4004-5.4002 0-.9719-.258-1.883-.7073-2.6708C22.7283 14.7068 24 12.8418 24 10.6795c0-2.9823-2.4175-5.4006-5.3998-5.4006-.417 0-.8223.049-1.2121.1384C17.2112 2.5949 14.867.3598 11.9998.3598zm-5.717 6.8683h10.5924c.7458 0 1.352.605 1.352 1.3487v7.6463c0 .7438-.6062 1.3482-1.352 1.3482h-3.6085l-7.24 3.5491 1.1008-3.5491h-.8447c-.7458 0-1.3522-.6044-1.3522-1.3482V8.5768c0-.7438.6064-1.3487 1.3522-1.3487Z"
              />
            </svg>
          </div>
          <div class="hidden md:block">
            <div class="ml-10 flex items-baseline space-x-4">
              <RouterLink
                v-for="nav in navigation"
                :key="nav.name"
                :to="{ name: nav.to }"
                :class="[
                  route.name === nav.to
                    ? 'bg-gray-900 dark:bg-gray-700 text-white dark:text-white'
                    : 'text-black dark:text-slate-300 hover:text-white',
                  'px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-500',
                ]"
                :aria-current="route.name === nav.to ? 'page' : undefined"
                >{{ nav.name }}
              </RouterLink>
            </div>
          </div>
        </div>
        <div class="hidden md:block">
          <div class="ml-4 flex items-center md:ml-6">
            <button
              type="button"
              @click="setting.darkMode = !setting.darkMode"
              class="rounded-full p-1 text-gray-400 hover:text-gray-500 dark:hover:text-gray-200 focus:outline-none focus:ring-0 focus:ring-offset-0"
            >
              <span class="sr-only">Dark mode</span>
              <SunIcon
                class="w-6 h-6"
                v-show="setting.darkMode"
                aria-hidden="true"
              />
              <MoonIcon
                class="w-6 h-6"
                v-show="!setting.darkMode"
                aria-hidden="true"
              />
            </button>
          </div>
        </div>
        <div class="-mr-2 flex md:hidden">
          <!-- Mobile menu button -->
          <DisclosureButton
            class="inline-flex items-center justify-center rounded-md bg-gray-800 p-2 text-gray-400 hover:bg-gray-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800"
          >
            <span class="sr-only">Open main menu</span>
            <Bars3Icon v-if="!open" class="block h-6 w-6" aria-hidden="true" />
            <XMarkIcon v-else class="block h-6 w-6" aria-hidden="true" />
          </DisclosureButton>
        </div>
      </div>
    </div>

    <!-- Mobile Menu -->
    <DisclosurePanel class="md:hidden">
      <div class="space-y-1 px-2 pt-2 pb-3 sm:px-3">
        <DisclosureButton
          v-for="nav in navigation"
          :key="nav.name"
          as="a"
          @click="router.push({ name: nav.to })"
          :class="[
            route.name === nav.to
              ? 'bg-gray-900 dark:bg-gray-600 text-white dark:text-white'
              : 'text-black dark:text-slate-300 hover:text-white',
            'block px-3 py-2 rounded-md text-base font-medium hover:bg-gray-500',
          ]"
          :aria-current="route.name === nav.to ? 'page' : undefined"
          >{{ nav.name }}</DisclosureButton
        >
      </div>
      <div class="border-t border-gray-700 pt-4 pb-3">
        <div class="flex items-center px-5">
          <button
            type="button"
            @click="setting.darkMode = !setting.darkMode"
            class="ml-auto flex-shrink-0 rounded-full p-1 text-gray-400 hover:text-gray-500 dark:hover:text-gray-200 focus:outline-none focus:ring-0 focus:ring-offset-0"
          >
            <span class="sr-only">Dark mode</span>
            <SunIcon
              class="w-6 h-6"
              v-show="setting.darkMode"
              aria-hidden="true"
            />
            <MoonIcon
              class="w-6 h-6"
              v-show="!setting.darkMode"
              aria-hidden="true"
            />
          </button>
        </div>
      </div>
    </DisclosurePanel>
  </Disclosure>
</template>
