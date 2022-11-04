<script setup lang="ts">
import { ref, onUnmounted, onMounted, nextTick } from "vue";
import type { Ref } from "vue";
import { WISH } from "@/lib/wish";
import AccordionSection from "@/components/AccordionSection.vue";

const Endpoint = ref("");
const Disabled = ref(false);
const ErrorMessage = ref("");
const Logs = ref([""]);

const Client = ref(new WISH());
const MediaStreams: Ref<MediaStream[]> = ref([]);
const EnableControl = ref(false);
const HideHeader = ref(false)

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

    await nextTick()
    EnableControl.value = true;
    HideHeader.value = true
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
  const empty = new MediaStream();
  MediaStreams.value.push(empty);
});

onUnmounted(async () => {
  try {
    const client = Client.value;
    await client.Disconnect();
  } catch (e) {
    console.log((e as Error).message);
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
        <h1 class="font-bold text-3xl text-gray-900">WHEP Player</h1>
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
              <svg
                :class="[
                  Disabled ? '' : 'cursor-pointer',
                  'w-5 text-gray-600 h-5',
                ]"
                fill="currentColor"
                viewBox="0 0 16 16"
              >
                <path
                  d="M6.79 5.093A.5.5 0 0 0 6 5.5v5a.5.5 0 0 0 .79.407l3.5-2.5a.5.5 0 0 0 0-.814l-3.5-2.5z"
                />
                <path
                  d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V4zm15 0a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4z"
                />
              </svg>
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

        <div
          class="flex items-center justify-center text-center pt-5"
          v-show="ErrorMessage != ''"
        >
          {{ ErrorMessage }}
        </div>

        <section
          id="player-container"
          class="my-5 justify-center items-center flex"
        >
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
          <AccordionSection :title="'Connection History'">
            <ul class="pl-4">
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
