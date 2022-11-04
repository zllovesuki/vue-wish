<script setup lang="ts">
import { ref } from "vue";

const Open = ref(false);
defineProps<{
  title: string;
}>();
</script>

<template>
  <article class="border-b">
    <div
      :class="[
        Open ? 'bg-grey-lightest border-indigo-600' : 'border-transparent',
        'border-l-2',
      ]"
    >
      <header
        class="flex justify-between items-center p-5 pl-8 pr-8 cursor-pointer select-none"
        @click="Open = !Open"
      >
        <span
          :class="[
            Open ? 'text-indigo-600' : 'text-grey-darkest',
            'font-thin text-xl',
          ]"
        >
          {{ title }}
        </span>
        <div
          :class="[
            Open ? 'border-indigo-600 bg-indigo-600' : 'border-grey',
            'rounded-full border w-7 h-7 flex items-center justify-center',
          ]"
        >
          <!-- icon by feathericons.com -->
          <svg
            aria-hidden="true"
            data-reactid="281"
            fill="none"
            height="24"
            :stroke="!Open ? '#606F7B' : 'white'"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            viewbox="0 0 24 24"
            width="24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <polyline points="18 15 12 9 6 15" v-if="Open"></polyline>
            <polyline points="6 9 12 15 18 9" v-if="!Open"></polyline>
          </svg>
        </div>
      </header>
      <div v-show="Open">
        <div class="pl-8 pr-8 pb-5 text-grey-darkest text-sm bg-white">
          <slot></slot>
        </div>
      </div>
    </div>
  </article>
</template>
