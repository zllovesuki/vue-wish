<script setup lang="ts">
import { useNotificationStore } from "@/store/notification";
import { useSettingStore } from "@/store/setting";

import { ref, onUnmounted, onMounted, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";
import type { Ref } from "vue";

import AccordionSection from "@/components/AccordionSection.vue";
import AlertSection from "@/components/AlertSection.vue";
import SmallToggleGroup from "@/components/SmallToggleGroup.vue";
import { PlayIcon } from "@heroicons/vue/24/outline";

import { WISH } from "@/lib/wish";

const notification = useNotificationStore();
const setting = useSettingStore();

const Endpoint = ref("");
const Disabled = ref(false);
const ErrorMessage = ref("");
const Logs: Ref<string[]> = ref([]);

const Client = ref(new WISH());
const MediaStreams: Ref<MediaStream[]> = ref([]);
const EnableControl = ref(false);
const HideHeader = ref(false);
const Playing = ref(false);

const route = useRoute();
const router = useRouter();

async function play() {
  if (Disabled.value) {
    return;
  }
  MediaStreams.value.pop();

  try {
    EnableControl.value = false;
    Disabled.value = true;

    const client = Client.value;
    if (Playing.value) {
      try {
        await client.Disconnect();
      } catch (e) {
        notification.notify(
          `Error disconnecting previous stream: ${(e as Error).message}`
        );
      }
    }
    client.WithEndpoint(Endpoint.value, setting.trickle);

    const dst = await client.Play();
    MediaStreams.value.push(dst);
    ErrorMessage.value = "";

    await nextTick();
    EnableControl.value = true;
    HideHeader.value = true;
    Playing.value = true;
    router.push({
      query: {
        v: Endpoint.value,
      },
    });
  } catch (e) {
    ErrorMessage.value = (e as Error).message;
    Playing.value = false;
  }
  await nextTick();
  Disabled.value = false;
}

onMounted(() => {
  const client = Client.value;
  client.addEventListener("log", (ev) => {
    const now = new Date().toLocaleString();
    Logs.value.push(`${now}: ${ev.detail.message}`);
  });
  client.addEventListener("status", (ev) => {
    switch (ev.detail.status) {
      case "disconnected":
        ErrorMessage.value = "Disconnected from stream";
        break;
    }
  });

  if (typeof route.query.v === "string") {
    Endpoint.value = route.query.v;
  }
});

onUnmounted(async () => {
  if (!Playing.value) {
    return;
  }
  try {
    const client = Client.value;
    await client.Disconnect();
    notification.notify("Stream disconnected");
  } catch (e) {
    notification.notify(`Fail to disconnect stream: ${(e as Error).message}`);
  }
});
</script>

<template>
  <main>
    <div class="hero">
      <div
        class="hero-headline flex flex-col items-center justify-center text-center"
        v-show="!HideHeader"
      >
        <h1 class="font-bold text-3xl text-gray-900">
          Watch via
          <a
            href="https://datatracker.ietf.org/doc/draft-murillo-whep/"
            target="_blank"
            >WHEP</a
          >
        </h1>
        <p class="font-base text-base text-gray-600">
          Play an WebRTC stream with sub-second latency
        </p>
      </div>

      <div class="box pt-6">
        <div class="box-wrapper">
          <div
            class="bg-white rounded flex items-center p-3 shadow-sm border border-gray-200"
          >
            <button
              @click="play"
              class="outline-none focus:outline-none"
              :disabled="Disabled"
            >
              <PlayIcon
                :class="[
                  Disabled ? '' : 'cursor-pointer',
                  'w-8 text-gray-600 h-8',
                ]"
              />
            </button>
            <input
              type="play"
              @keydown.enter="play"
              placeholder="WHEP Endpoint"
              v-model="Endpoint"
              :disabled="Disabled"
              :class="[
                Disabled ? 'text-gray-400' : '',
                'w-full pl-4 text-sm outline-none focus:outline-none bg-transparent',
              ]"
            />
            <SmallToggleGroup
              :enabled="setting.trickle"
              @update:enabled="setting.trickle = $event"
              label="Trickle"
            />
          </div>
        </div>

        <AlertSection
          class="mt-5"
          :message="ErrorMessage"
          level="fail"
          :on-dismiss="
            () => {
              ErrorMessage = '';
            }
          "
          v-show="ErrorMessage !== ''"
        />

        <div class="block" aria-hidden="true">
          <div class="py-5">
            <div class="border-t border-gray-200" />
          </div>
        </div>
        <section id="player-container" class="justify-center items-center flex">
          <video
            v-for="src in MediaStreams"
            :key="src.id"
            :srcObject="src"
            :controls="EnableControl"
            class="w-full"
            autoplay="true"
          />
        </section>
        <section class="w-4/5 p-8 mx-auto pt-10 justify-center items-center">
          <AccordionSection
            :title="`Connection History (${Logs.length})`"
            :expandable="Logs.length > 0"
          >
            <ul class="pt-4">
              <li class="pb-2" v-for="(log, index) in Logs" :key="index">
                {{ log }}
              </li>
            </ul>
          </AccordionSection>
        </section>
      </div>
    </div>
  </main>
</template>
