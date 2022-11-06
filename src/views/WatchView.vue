<script setup lang="ts">
import { useNotificationStore } from "@/store/notification";
import AccordionSection from "@/components/AccordionSection.vue";
import AlertSection from "@/components/AlertSection.vue";
import { PlayIcon } from "@heroicons/vue/24/outline";
import { ref, onUnmounted, onMounted, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";
import type { Ref } from "vue";

import { WISH } from "@/lib/wish";

const notification = useNotificationStore();

const Endpoint = ref("");
const Disabled = ref(false);
const ErrorMessage = ref("");
const Logs: Ref<string[]> = ref([]);

const Client = ref(new WISH());
const MediaStreams: Ref<MediaStream[]> = ref([]);
const EnableControl = ref(false);
const HideHeader = ref(false);

const route = useRoute();
const router = useRouter();

async function play() {
  if (Disabled.value) {
    return;
  }
  try {
    Disabled.value = true;

    const client = Client.value;
    client.WithEndpoint(Endpoint.value);

    const dst = new MediaStream();
    await client.Play(dst);
    MediaStreams.value.pop();
    MediaStreams.value.push(dst);
    ErrorMessage.value = "";

    await nextTick();
    EnableControl.value = true;
    HideHeader.value = true;
    router.push({
      query: {
        v: Endpoint.value,
      },
    });
  } catch (e) {
    Disabled.value = false;
    ErrorMessage.value = (e as Error).message;
  }
}

onMounted(() => {
  const client = Client.value;
  client.SetLogListener((log: string) => {
    Logs.value.push(log);
  });

  if (typeof route.query.v === "string") {
    Endpoint.value = route.query.v;
  }
});

onUnmounted(async () => {
  if (!HideHeader.value) {
    return;
  }
  try {
    const client = Client.value;
    await client.Disconnect();
    notification.message = "Stream disconnected";
    notification.show = true;
  } catch (e) {
    notification.message = `Fail to disconnect stream: ${(e as Error).message}`;
    notification.show = true;
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
