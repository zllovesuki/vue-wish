<script setup lang="ts">
import { useNotificationStore } from "@/store/notification";
import { useSettingStore } from "@/store/setting";

import { ref, onUnmounted, onMounted, computed, nextTick, type Ref } from "vue";

import AccordionSection from "@/components/AccordionSection.vue";
import AlertSection from "@/components/AlertSection.vue";
import SmallToggleGroup from "@/components/SmallToggleGroup.vue";
import { VideoCameraIcon } from "@heroicons/vue/24/outline";

import { WISH } from "@/lib/wish";

const notification = useNotificationStore();
const setting = useSettingStore();

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
const readyToGoLive = computed(() => {
  return hasAudio.value && hasVideo.value;
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
    ErrorMessage.value = `Permission error: ${(e as Error).message}`;
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
    ErrorMessage.value = `Permission error: ${(e as Error).message}`;
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
    client.WithEndpoint(Endpoint.value, setting.trickle);

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
    if (!Live.value) {
      return;
    }
    const client = Client.value;
    await client.Disconnect();
    notification.message = "Livestream ended";
    notification.show = true;
  } catch (e) {
    notification.message = `Fail to end livestream: ${(e as Error).message}`;
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
            class="bg-white rounded flex items-center p-3 shadow-sm border border-gray-200"
          >
            <button
              @click="publish"
              class="outline-none focus:outline-none"
              :disabled="Disabled || !readyToGoLive"
            >
              <VideoCameraIcon
                :class="[
                  Disabled || !readyToGoLive
                    ? 'cursor-not-allowed'
                    : 'cursor-pointer',
                  'w-8 text-gray-600 h-8',
                ]"
              />
            </button>
            <input
              type="publish"
              @keydown.enter="publish"
              placeholder="WHIP Endpoint"
              v-model="Endpoint"
              :disabled="Disabled || !readyToGoLive"
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

        <div v-show="readyToGoLive">
          <div class="md:grid md:grid-cols-3 md:gap-6">
            <div class="md:col-span-1">
              <div class="px-4 sm:px-0">
                <h3 class="text-lg font-medium leading-6 text-gray-900">
                  Then, you are ready to go live!
                </h3>
                <p class="mt-1 text-sm text-gray-600">
                  <span
                    :class="
                      'inline-flex items-center rounded-md mx-2 px-2.5 py-0.5 text-sm font-medium ' +
                      (Live ? 'bg-green-100' : 'bg-red-100') +
                      ' ' +
                      (Live ? 'text-green-800' : 'text-red-800')
                    "
                    >Live</span
                  >
                </p>
              </div>
            </div>
            <div class="mt-5 md:col-span-2 md:mt-0">
              <form>
                <div class="overflow-hidden shadow sm:rounded-md">
                  <div class="bg-white px-4 py-5 sm:p-6">
                    <div class="grid grid-none">
                      <div class="col-span-6 sm:col-span-3">
                        <label
                          for="instruction"
                          class="block text-sm font-medium text-gray-700"
                          >Enter your WHIP endpoint above and press the Enter
                          key to go live</label
                        >
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>

        <div class="hidden sm:block" aria-hidden="true" v-show="readyToGoLive">
          <div class="py-5">
            <div class="border-t border-gray-200" />
          </div>
        </div>

        <div :class="readyToGoLive ? 'mt-10 sm:mt-0' : ''">
          <div class="md:grid md:grid-cols-3 md:gap-6">
            <div class="md:col-span-1">
              <div class="px-4 sm:px-0">
                <h3 class="text-lg font-medium leading-6 text-gray-900">
                  First, choose stream sources
                </h3>
                <p class="mt-1 text-sm text-gray-600">
                  <span
                    :class="
                      'inline-flex items-center rounded-md mx-2 px-2.5 py-0.5 text-sm font-medium ' +
                      (hasVideo ? 'bg-green-100' : 'bg-red-100') +
                      ' ' +
                      (hasVideo ? 'text-green-800' : 'text-red-800')
                    "
                    >Video</span
                  >
                  <span
                    :class="
                      'inline-flex items-center rounded-md mx-2 px-2.5 py-0.5 text-sm font-medium ' +
                      (hasAudio ? 'bg-green-100' : 'bg-red-100') +
                      ' ' +
                      (hasAudio ? 'text-green-800' : 'text-red-800')
                    "
                    >Audio</span
                  >
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
