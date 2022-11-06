<script setup lang="ts">
import { Disclosure, DisclosureButton, DisclosurePanel } from "@headlessui/vue";
import { Bars3Icon, XMarkIcon } from "@heroicons/vue/24/outline";
import { ref } from "vue";
import { RouterLink } from "vue-router";
import { useRoute, useRouter } from "vue-router";

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
  <Disclosure as="nav" class="bg-gray" v-slot="{ open }">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="flex h-16 items-center justify-between">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <!-- icon from https://www.svgrepo.com/svg/304488/media -->
            <svg
              class="w-8 h-8"
              viewBox="0 0 24 24"
              id="_24x24_On_Light_Media"
              data-name="24x24/On Light/Media"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect id="view-box" width="24" height="24" fill="none" />
              <path
                id="Shape"
                d="M2.75,17.5A2.753,2.753,0,0,1,0,14.749v-8A2.754,2.754,0,0,1,2.75,4h9A2.753,2.753,0,0,1,14.5,6.643L17.1,5.6a1.75,1.75,0,0,1,2.4,1.625v7.046A1.75,1.75,0,0,1,17.1,15.9l-2.6-1.041A2.752,2.752,0,0,1,11.75,17.5ZM1.5,6.75v8A1.251,1.251,0,0,0,2.75,16h9A1.251,1.251,0,0,0,13,14.749v-8A1.252,1.252,0,0,0,11.75,5.5h-9A1.252,1.252,0,0,0,1.5,6.75Zm16.157.245L14.5,8.258v4.985l3.157,1.263a.254.254,0,0,0,.093.018.25.25,0,0,0,.25-.25V7.227a.239.239,0,0,0-.018-.093.248.248,0,0,0-.232-.158A.257.257,0,0,0,17.657,6.995ZM2.75,1.5a.75.75,0,1,1,0-1.5h9a.75.75,0,0,1,0,1.5Z"
                transform="translate(2.25 3.25)"
                fill="#141124"
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
                    ? 'bg-gray-900 text-white'
                    : 'text-black hover:bg-gray-500 hover:text-white',
                  'px-3 py-2 rounded-md text-sm font-medium',
                ]"
                :aria-current="route.name === nav.to ? 'page' : undefined"
                >{{ nav.name }}
              </RouterLink>
            </div>
          </div>
        </div>
        <div class="-mr-2 flex md:hidden">
          <DisclosureButton
            class="inline-flex items-center justify-center rounded-md bg-gray-800 p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800"
          >
            <span class="sr-only">Open main menu</span>
            <Bars3Icon v-if="!open" class="block h-6 w-6" aria-hidden="true" />
            <XMarkIcon v-else class="block h-6 w-6" aria-hidden="true" />
          </DisclosureButton>
        </div>
      </div>
    </div>

    <DisclosurePanel class="md:hidden">
      <div class="space-y-1 px-2 pt-2 pb-3 sm:px-3">
        <DisclosureButton
          v-for="nav in navigation"
          :key="nav.name"
          as="a"
          @click="router.push({ path: nav.to })"
          :class="[
            route.path === nav.to
              ? 'bg-gray-900 text-white'
              : 'text-black hover:bg-gray-500 hover:text-white',
            'block px-3 py-2 rounded-md text-base font-medium',
          ]"
          :aria-current="route.path === nav.to ? 'page' : undefined"
          >{{ nav.name }}</DisclosureButton
        >
      </div>
    </DisclosurePanel>
  </Disclosure>
</template>
