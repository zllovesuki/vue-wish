<script setup lang="ts">
import { computed } from "vue";

import { Switch, SwitchGroup, SwitchLabel } from "@headlessui/vue";

const props = defineProps<{
  enabled: boolean;
  label: string;
}>();
const emit = defineEmits(["update:enabled"]);

const value = computed({
  get() {
    return props.enabled;
  },
  set(value) {
    emit("update:enabled", value);
  },
});
</script>

<template>
  <SwitchGroup as="div" class="flex items-center">
    <Switch
      v-model="value"
      class="group relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
    >
      <span class="sr-only">Use setting</span>
      <span
        aria-hidden="true"
        class="pointer-events-none absolute h-full w-full rounded-md bg-white"
      />
      <span
        aria-hidden="true"
        :class="[
          value ? 'bg-indigo-600' : 'bg-gray-200',
          'pointer-events-none absolute mx-auto h-4 w-9 rounded-full transition-colors duration-200 ease-in-out',
        ]"
      />
      <span
        aria-hidden="true"
        :class="[
          value ? 'translate-x-5' : 'translate-x-0',
          'pointer-events-none absolute left-0 inline-block h-5 w-5 transform rounded-full border border-gray-200 bg-white shadow ring-0 transition-transform duration-200 ease-in-out',
        ]"
      />
    </Switch>
    <SwitchLabel as="span" class="ml-3">
      <span class="text-xs font-medium text-gray-900">{{ label }}</span>
    </SwitchLabel>
  </SwitchGroup>
</template>
