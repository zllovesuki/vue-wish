<script setup lang="ts">
import { ref, computed } from "vue";

const props = defineProps<{
  expandable?: boolean;
  title: string;
}>();

const Open = ref(false);

const canExpand = computed(() => {
  if (typeof props.expandable !== "undefined") {
    return props.expandable;
  }
  return true;
});

function toggle() {
  if (typeof props.expandable !== "undefined") {
    if (!props.expandable) {
      return;
    }
  }
  Open.value = !Open.value;
}
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
        :class="[
          canExpand ? 'cursor-pointer' : 'cursor-not-allowed',
          'flex justify-between items-center p-5 pl-8 pr-8 select-none',
        ]"
        @click="toggle"
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
