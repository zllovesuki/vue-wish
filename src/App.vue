<script setup lang="ts">
import "@/assets/main.css";

import NavBar from "@/components/NavBar.vue";
import { RouterView } from "vue-router";
</script>

<template>
  <div class="min-h-full">
    <NavBar />
    <main>
      <div class="mx-auto max-w-screen-2xl py-6 sm:px-6 lg:px-8">
        <RouterView />
      </div>
    </main>
  </div>
</template>
