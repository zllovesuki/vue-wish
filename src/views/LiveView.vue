<script setup lang="ts">
import AccordionSection from "@/components/AccordionSection.vue";
import LiveIcon from "@/components/icons/LiveIcon.vue";
import CheckIcon from "@/components/icons/CheckIcon.vue";
import CrossIcon from "@/components/icons/CrossIcon.vue";
import { ref, onUnmounted, onMounted, computed, nextTick } from "vue";
import type { Ref } from "vue";

import { WISH } from "@/lib/wish";

const Endpoint = ref("");
const Disabled = ref(false);
const ErrorMessage = ref("");
const Logs: Ref<string[]> = ref([]);

const Client = ref(new WISH());
const HideHeader = ref(false);

const Live = ref(false);
const VideoSource: Ref<MediaStream | undefined> = ref();
const AudioSource: Ref<MediaStream | undefined> = ref();
const VideoPreview: Ref<HTMLVideoElement | undefined> = ref();
const hasVideo = computed(() => {
  return typeof VideoSource.value !== "undefined";
});
const hasAudio = computed(() => {
  return typeof AudioSource.value !== "undefined";
});

async function getVideo() {
  // eslint-disable-next-line no-undef
  const constraints: MediaStreamConstraints = {
    audio: false,
    video: true,
  };

  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    VideoSource.value = stream;
    if (VideoPreview.value) {
      VideoPreview.value.srcObject = stream;
    }
    ErrorMessage.value = "";
  } catch (e) {
    ErrorMessage.value = (e as Error).message;
  }
}

async function getAudio() {
  // eslint-disable-next-line no-undef
  const constraints: MediaStreamConstraints = {
    audio: true,
    video: false,
  };

  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    AudioSource.value = stream;
    ErrorMessage.value = "";
  } catch (e) {
    ErrorMessage.value = (e as Error).message;
  }
}

async function publish() {
  if (Disabled.value) {
    return;
  }
  if (!VideoSource.value || !AudioSource.value) {
    return;
  }
  try {
    Disabled.value = true;

    const client = Client.value;
    client.WithEndpoint(Endpoint.value);

    const src = new MediaStream();
    src.addTrack(VideoSource.value.getTracks()[0]);
    src.addTrack(AudioSource.value.getTracks()[0]);
    await client.Publish(src);

    await nextTick();
    HideHeader.value = true;
    Live.value = true;
  } catch (e) {
    Disabled.value = false;
    ErrorMessage.value = (e as Error).message;
  }
}

onMounted(async () => {
  const client = Client.value;
  client.SetLogListener((log: string) => {
    Logs.value.push(log);
  });
});

onUnmounted(async () => {
  try {
    if (VideoSource.value) {
      VideoSource.value.getTracks().forEach((track) => {
        track.stop();
      });
    }
    if (AudioSource.value) {
      AudioSource.value.getTracks().forEach((track) => {
        track.stop();
      });
    }
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
        <h1 class="font-bold text-3xl text-gray-900">
          Go Live via
          <a href="https://datatracker.ietf.org/doc/draft-ietf-wish-whip/"
            >WHIP</a
          >
        </h1>
        <p class="font-base text-base text-gray-600">
          Publish an WebRTC stream with sub-second latency to viewers
        </p>
      </div>
      <div class="box pt-6">
        <div class="box-wrapper">
          <div
            v-show="hasVideo && hasAudio"
            class="bg-white rounded flex items-center p-3 shadow-sm border border-gray-200"
          >
            <button
              @click="publish"
              class="outline-none focus:outline-none"
              :disabled="Disabled"
            >
              <LiveIcon
                :class="[
                  Disabled ? '' : 'cursor-pointer',
                  'w-8 text-gray-600 h-8',
                ]"
              />
            </button>
            <input
              type="publish"
              @keydown.enter="publish"
              placeholder="WHIP Endpoint"
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

        <div class="block" aria-hidden="true">
          <div class="py-5">
            <div class="border-t border-gray-200" />
          </div>
        </div>

        <div>
          <div class="md:grid md:grid-cols-3 md:gap-6">
            <div class="md:col-span-1">
              <div class="px-4 sm:px-0">
                <h3 class="text-lg font-medium leading-6 text-gray-900">
                  Stream Source
                </h3>
                <p class="mt-1 text-sm text-gray-600">
                  Video:
                  <CheckIcon class="w-4 h-3 inline" v-if="hasVideo" /><CrossIcon
                    class="w-4 h-3 inline"
                    v-else
                  />
                </p>
                <p class="mt-1 text-sm text-gray-600">
                  Audio:
                  <CheckIcon class="w-4 h-3 inline" v-if="hasAudio" /><CrossIcon
                    class="w-4 h-3 inline"
                    v-else
                  />
                </p>
                <p class="mt-1 text-sm text-gray-600">
                  Live:
                  <CheckIcon class="w-4 h-3 inline" v-if="Live" /><CrossIcon
                    class="w-4 h-3 inline"
                    v-else
                  />
                </p>
              </div>
            </div>
            <div class="mt-5 md:col-span-2 md:mt-0">
              <form @submit.prevent>
                <div class="shadow sm:overflow-hidden sm:rounded-md">
                  <div class="space-y-6 bg-white px-4 py-5 sm:p-6">
                    <div>
                      <button
                        v-show="!hasVideo"
                        @click="getVideo"
                        class="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 mx-4 px-4 mb-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                      >
                        Get Camera Permission
                      </button>
                      <button
                        v-show="!hasAudio"
                        @click="getAudio"
                        class="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 mx-4 px-4 mb-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                      >
                        Get Microphone Permission
                      </button>
                      <video
                        class="flex justify-center pt-2"
                        ref="VideoPreview"
                        v-show="VideoSource"
                        autoplay
                      ></video>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
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
