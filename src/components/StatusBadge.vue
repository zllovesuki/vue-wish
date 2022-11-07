<script setup lang="ts">
defineProps<{
  enabled: boolean;
  text: string;
}>();
</script>

<template>
  <span
    :class="
      'inline-flex items-center rounded-md mx-2 mb-2 px-2.5 py-0.5 text-sm font-medium ' +
      (enabled
        ? 'bg-green-200 dark:bg-green-400/25'
        : 'bg-red-200 dark:bg-red-400/25') +
      ' ' +
      (enabled
        ? 'text-green-800 dark:text-green-300'
        : 'text-red-800 dark:text-red-300')
    "
    >{{ text }}
    <slot name="enabled" v-if="enabled"></slot>
    <slot name="disabled" v-if="!enabled"></slot>
  </span>
</template>
