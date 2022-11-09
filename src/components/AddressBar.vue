<script setup lang="ts">
import SmallToggleGroup from "@/components/SmallToggleGroup.vue";
import { useSettingStore } from "@/store/setting";
import { computed } from "vue";

const setting = useSettingStore();

const props = defineProps<{
  action: () => void;
  value: string;
  blur?: boolean;
  disabled: boolean;
  placeholder: string;
}>();

const emit = defineEmits(["update:value"]);

const value = computed({
  get() {
    return props.value;
  },
  set(value) {
    emit("update:value", value);
  },
});
</script>

<template>
  <div
    class="bg-white dark:bg-slate-800 rounded flex items-center p-3 shadow-sm border border-gray-200 dark:border-gray-700"
  >
    <button
      @click="action"
      class="outline-none focus:outline-none"
      :disabled="disabled"
    >
      <slot></slot>
    </button>
    <input
      type="text"
      @keydown.enter="action"
      :placeholder="placeholder"
      v-model="value"
      :disabled="disabled"
      :class="[
        disabled ? 'cursor-not-allowed' : '',
        blur ? 'blur-sm' : '',
        'w-full pl-4 text-sm outline-none focus:outline-none bg-transparent border-none focus:ring-0 focus:ring-offset-0 dark:text-white text-black disabled:text-gray-400 dark:disabled:text-gray-400 placeholder-gray-600 dark:placeholder-gray-400',
      ]"
    />
    <SmallToggleGroup
      :enabled="setting.trickle"
      @update:enabled="setting.trickle = $event"
      label="Trickle"
    />
  </div>
</template>
