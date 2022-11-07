<script setup lang="ts">
import { useNotificationStore } from "@/store/notification";
import { useSettingStore } from "@/store/setting";

import { ref, onUnmounted, onMounted, computed, nextTick, type Ref } from "vue";

import AddressBar from "@/components/AddressBar.vue";
import StatusBadge from "@/components/StatusBadge.vue";
import AccordionSection from "@/components/AccordionSection.vue";
import AlertSection from "@/components/AlertSection.vue";
import HorizontalDivider from "@/components/HorizontalDivider.vue";
import {
  VideoCameraIcon,
  VideoCameraSlashIcon,
  NoSymbolIcon,
  SparklesIcon,
  BoltSlashIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  SignalIcon,
  PhotoIcon,
} from "@heroicons/vue/24/outline";

import { WISH } from "@/lib/wish";
import type { AlertLevel } from "@/types/level";

const notification = useNotificationStore();
const setting = useSettingStore();

const Endpoint = ref("");
const Disabled = ref(false);
const Logs: Ref<string[]> = ref([]);

const Client = ref(new WISH());
const HideHeader = ref(false);

const Live = ref(false);
const RearCamera: Ref<MediaStream | undefined> = ref();
const VideoSource: Ref<MediaStream | undefined> = ref();
const AudioSource: Ref<MediaStream | undefined> = ref();
const CurrentVideoSource: Ref<MediaStream | undefined> = ref();
const VideoEnabled = ref(true);
const AudioEnabled = ref(true);
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

const AlertMessage = ref("");
const MessageLevel: Ref<AlertLevel> = ref("info");
function setAlert(level: AlertLevel, msg: string) {
  MessageLevel.value = level;
  AlertMessage.value = msg;
}
function clearAlert() {
  AlertMessage.value = "";
}

const hasRearCamera = computed(() => {
  return typeof RearCamera.value !== "undefined";
});
const usingRearCamera = computed(() => {
  if (!RearCamera.value) {
    return false;
  }
  return RearCamera.value === CurrentVideoSource.value;
});
async function toggleCameraSource() {
  if (!RearCamera.value || !VideoSource.value || !CurrentVideoSource.value) {
    return;
  }

  const client = Client.value;
  if (usingRearCamera.value) {
    RearCamera.value.getTracks()[0].enabled = false;
    VideoSource.value.getTracks()[0].enabled = true;
    CurrentVideoSource.value = VideoSource.value;
  } else {
    VideoSource.value.getTracks()[0].enabled = false;
    RearCamera.value.getTracks()[0].enabled = true;
    CurrentVideoSource.value = RearCamera.value;
  }
  if (VideoPreview.value) {
    VideoPreview.value.srcObject = CurrentVideoSource.value;
  }

  try {
    await client.ReplaceVideoTrack(CurrentVideoSource.value);
  } catch (e) {
    notification.notify(
      `Failed to change stream source: ${(e as Error).message}`
    );
  }
}

async function findRearCamera() {
  try {
    const backCamera = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: {
          exact: "environment",
        },
      },
    });
    RearCamera.value = backCamera;
  } catch (e) {
    if (e instanceof OverconstrainedError) {
      console.log("no rear facing camera");
    } else {
      console.log("has rear facing camera");
    }
  }
}

async function getVideo() {
  // eslint-disable-next-line no-undef
  const constraints: MediaStreamConstraints = {
    audio: false,
    video: {
      facingMode: {
        exact: "user",
      },
    },
  };

  clearAlert();
  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    VideoSource.value = stream;
    if (VideoPreview.value) {
      VideoPreview.value.srcObject = stream;
    }
    CurrentVideoSource.value = stream;
    await findRearCamera();
  } catch (e) {
    setAlert("fail", `Permission error: ${(e as Error).message}`);
  }
}

async function toggleVideo() {
  if (CurrentVideoSource.value) {
    const track = CurrentVideoSource.value.getTracks()[0];
    VideoEnabled.value = track.enabled = !track.enabled;
  }
}

async function getAudio() {
  // eslint-disable-next-line no-undef
  const constraints: MediaStreamConstraints = {
    audio: true,
    video: false,
  };

  clearAlert();
  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    AudioSource.value = stream;
  } catch (e) {
    setAlert("fail", `Permission error: ${(e as Error).message}`);
  }
}

async function toggleAudio() {
  if (AudioSource.value) {
    const track = AudioSource.value.getTracks()[0];
    AudioEnabled.value = track.enabled = !track.enabled;
  }
}

async function publish() {
  if (Disabled.value) {
    return;
  }
  if (!CurrentVideoSource.value || !AudioSource.value) {
    return;
  }
  clearAlert();
  try {
    Disabled.value = true;

    const client = Client.value;
    client.WithEndpoint(Endpoint.value, setting.trickle);

    const src = new MediaStream();
    const videoTrack = CurrentVideoSource.value.getTracks()[0];
    console.log(videoTrack.getSettings());
    const audioTrack = AudioSource.value.getTracks()[0];
    console.log(audioTrack.getSettings());
    src.addTrack(videoTrack);
    src.addTrack(audioTrack);
    await client.Publish(src);

    await nextTick();
    HideHeader.value = true;
    Live.value = true;
  } catch (e) {
    Disabled.value = false;
    setAlert("fail", (e as Error).message);
  }
}

async function end() {
  if (!Live.value) {
    return;
  }
  try {
    const client = Client.value;
    await client.Disconnect();
    notification.notify("Livestream ended");

    await nextTick();
    Disabled.value = false;
    Live.value = false;
  } catch (e) {
    notification.notify(`Fail to end livestream: ${(e as Error).message}`);
  }
}

onMounted(async () => {
  const client = Client.value;
  client.addEventListener("log", (ev) => {
    const now = new Date().toLocaleString();
    Logs.value.push(`${now}: ${ev.detail.message}`);
  });
  client.addEventListener("status", (ev) => {
    switch (ev.detail.status) {
      case "disconnected":
        setAlert("info", "Disconnected from stream");
        break;
    }
  });
});

onUnmounted(async () => {
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
  await end();
});
</script>

<template>
  <main>
    <div
      class="hero-headline flex flex-col items-center justify-center text-center"
      v-show="!HideHeader"
    >
      <h1 class="font-bold text-3xl text-gray-900 dark:text-gray-300">
        Go Live via
        <a href="https://datatracker.ietf.org/doc/draft-ietf-wish-whip/"
          >WHIP</a
        >
      </h1>
      <p class="font-base text-base text-gray-600 dark:text-gray-500">
        Publish an WebRTC stream with sub-second latency to viewers
      </p>
    </div>
    <div class="box pt-6">
      <div class="box-wrapper">
        <AddressBar
          :action="publish"
          placeholder="WHIP Endpoint"
          :disabled="Disabled || !readyToGoLive"
          :value="Endpoint"
          @update:value="Endpoint = $event"
        >
          <SignalIcon
            :class="[
              Disabled || !readyToGoLive
                ? 'cursor-not-allowed'
                : 'cursor-pointer',
              'w-8 h-8 text-gray-600 dark:text-gray-400',
            ]"
          />
        </AddressBar>
      </div>

      <AlertSection
        class="mt-5"
        :message="AlertMessage"
        :level="MessageLevel"
        :on-dismiss="clearAlert"
        v-show="AlertMessage !== ''"
      />

      <HorizontalDivider />

      <div v-show="readyToGoLive">
        <div class="md:grid md:grid-cols-3 md:gap-6">
          <div class="md:col-span-1">
            <div class="px-4 sm:px-0">
              <h3
                class="text-lg font-medium leading-6 text-gray-900 dark:text-gray-300"
              >
                Then, you are ready to go live!
              </h3>
              <p class="mt-2 text-sm text-gray-600">
                <StatusBadge text="Live" :enabled="Live">
                  <template #enabled>
                    <SparklesIcon class="ml-1 w-5 h-5" />
                  </template>
                  <template #disabled>
                    <BoltSlashIcon class="ml-1 w-5 h-5" />
                  </template>
                </StatusBadge>
              </p>
            </div>
          </div>
          <div class="mt-5 md:col-span-2 md:mt-0">
            <form>
              <div class="overflow-hidden shadow sm:rounded-md">
                <div class="bg-white dark:bg-slate-800 px-4 py-5 sm:p-6">
                  <div class="grid grid-cols-6 gap-6">
                    <div
                      :class="
                        Live
                          ? 'col-span-6 sm:col-span-3'
                          : 'col-span-12 sm:col-span-6'
                      "
                    >
                      <div class="mt-1 flex items-center">
                        <span
                          class="inline-block text-sm text-gray-700 dark:text-gray-300"
                        >
                          Enter your WHIP endpoint and press the Enter key
                        </span>
                      </div>
                    </div>
                    <div class="col-span-6 sm:col-span-3" v-show="Live">
                      <button
                        type="button"
                        @click="end"
                        :disbled="Disabled"
                        class="relative inline-flex items-center rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 px-4 py-2 text-sm font-medium dark:text-gray-200 dark:hover:bg-gray-600 hover:bg-gray-50 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        End Livestream
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      <HorizontalDivider v-show="readyToGoLive" />

      <div :class="readyToGoLive ? 'mt-10 sm:mt-0' : ''">
        <div class="md:grid md:grid-cols-3 md:gap-6">
          <div class="md:col-span-1">
            <div class="px-4 sm:px-0">
              <h3
                class="text-lg font-medium leading-6 text-gray-900 dark:text-gray-300"
              >
                First, choose stream sources
              </h3>
              <p class="mt-2 text-sm text-gray-600">
                <StatusBadge text="Video" :enabled="hasVideo && VideoEnabled">
                  <template #enabled>
                    <VideoCameraIcon class="ml-1 w-5 h-5" />
                  </template>
                  <template #disabled>
                    <VideoCameraSlashIcon class="ml-1 w-5 h-5" />
                  </template>
                </StatusBadge>
                <StatusBadge text="Audio" :enabled="hasAudio && AudioEnabled">
                  <template #enabled>
                    <SpeakerWaveIcon class="ml-1 w-5 h-5" />
                  </template>
                  <template #disabled>
                    <SpeakerXMarkIcon class="ml-1 w-5 h-5" />
                  </template>
                </StatusBadge>
                <StatusBadge
                  text="Rear Camera"
                  :enabled="hasVideo && hasRearCamera"
                >
                  <template #enabled>
                    <PhotoIcon class="ml-1 w-5 h-5" />
                  </template>
                  <template #disabled>
                    <NoSymbolIcon class="ml-1 w-5 h-5" />
                  </template>
                </StatusBadge>
              </p>
            </div>
          </div>

          <div class="mt-5 md:col-span-2 md:mt-0">
            <form @submit.prevent>
              <div class="shadow sm:overflow-hidden sm:rounded-md">
                <div
                  class="space-y-6 bg-white dark:bg-slate-800 px-4 py-5 sm:p-6"
                >
                  <div>
                    <span
                      class="isolate inline-flex rounded-md shadow-sm"
                      v-show="!readyToGoLive"
                    >
                      <button
                        type="button"
                        @click="getVideo"
                        class="relative inline-flex items-center rounded-l-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 px-4 py-2 text-sm font-medium dark:text-gray-200 dark:hover:bg-gray-600 hover:bg-gray-50 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        Get Camera Permission
                      </button>
                      <button
                        type="button"
                        @click="getAudio"
                        class="relative -ml-px inline-flex items-center rounded-r-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 px-4 py-2 text-sm font-medium dark:text-gray-200 dark:hover:bg-gray-600 hover:bg-gray-50 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        Get Microphone Permission
                      </button>
                    </span>
                    <span
                      class="isolate inline-flex rounded-md shadow-sm"
                      v-show="readyToGoLive"
                    >
                      <button
                        type="button"
                        @click="toggleVideo"
                        class="relative inline-flex items-center rounded-l-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 px-4 py-2 text-sm font-medium dark:text-gray-200 dark:hover:bg-gray-600 hover:bg-gray-50 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        Turn {{ VideoEnabled ? "off" : "on " }} Camera
                      </button>
                      <button
                        type="button"
                        @click="toggleCameraSource"
                        v-show="hasRearCamera"
                        :disabled="!VideoEnabled"
                        :class="[
                          VideoEnabled
                            ? 'cursor-pointer'
                            : 'cursor-not-allowed',
                          'relative -ml-px inline-flex items-center border border-gray-300 dark:border-gray-600 dark:bg-gray-700 px-4 py-2 text-sm font-medium dark:text-gray-200 dark:hover:bg-gray-600 hover:bg-gray-50 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500',
                        ]"
                      >
                        Use {{ usingRearCamera ? "front" : "rear " }} Camera
                      </button>
                      <button
                        type="button"
                        @click="toggleAudio"
                        class="relative -ml-px inline-flex items-center rounded-r-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 px-4 py-2 text-sm font-medium dark:text-gray-200 dark:hover:bg-gray-600 hover:bg-gray-50 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        Turn {{ AudioEnabled ? "off" : "on " }} Microphone
                      </button>
                    </span>
                    <video
                      class="flex justify-center py-4"
                      ref="VideoPreview"
                      v-show="VideoSource && VideoEnabled"
                      autoplay
                    ></video>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      <HorizontalDivider />

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
  </main>
</template>
