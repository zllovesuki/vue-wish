<script setup lang="ts">
import { useNotificationStore } from "@/store/notification";
import { useSettingStore } from "@/store/setting";

import {
  ref,
  onUnmounted,
  onMounted,
  computed,
  nextTick,
  watchEffect,
  type Ref,
} from "vue";

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

type Source = "Front" | "Rear" | "Screen" | "None";

const notification = useNotificationStore();
const setting = useSettingStore();

const Endpoint = ref("");
const Disabled = ref(false);
const Logs: Ref<string[]> = ref([]);

const Client = new WISH()
const HideHeader = ref(false);

const Live = ref(false);
const RearCamera: Ref<MediaStream | undefined> = ref();
const VideoSource: Ref<MediaStream | undefined> = ref();
const AudioSource: Ref<MediaStream | undefined> = ref();
const ScreenShareSource: Ref<MediaStream | undefined> = ref();
const SourceBeforeScreenShare: Ref<MediaStream | undefined> = ref();
const ActiveVideoSource: Ref<MediaStream | undefined> = ref();
const VideoEnabled = ref(true);
const AudioEnabled = ref(true);
const VideoPreview: Ref<HTMLVideoElement | undefined> = ref();

const BounceIcon = ref(false);

const hasVideo = computed(() => {
  return typeof VideoSource.value !== "undefined";
});
const hasAudio = computed(() => {
  return typeof AudioSource.value !== "undefined";
});
const readyToGoLive = computed(() => {
  return hasAudio.value && hasVideo.value;
});

function getTrack(src: MediaStream): MediaStreamTrack {
  return src.getTracks()[0]
}

const CurrentSource = computed(():Source=> {
  if (!ActiveVideoSource.value) {
    return "None";
  }
  const srcId = ActiveVideoSource.value.id;
  if (VideoSource.value && VideoSource.value.id === srcId) {
    return "Front";
  }
  if (RearCamera.value && RearCamera.value.id === srcId) {
    return "Rear";
  }
  if (ScreenShareSource.value && ScreenShareSource.value.id === srcId) {
    return "Screen";
  }
  return "None";
})

const AlertMessage = ref("");
const MessageLevel: Ref<AlertLevel> = ref("info");
function setAlert(level: AlertLevel, msg: string) {
  MessageLevel.value = level;
  AlertMessage.value = msg;
}
function clearAlert() {
  AlertMessage.value = "";
}

const hasScreenShare = computed(() => {
  return !!navigator.mediaDevices.getDisplayMedia;
});
async function toggleScreenShare() {
  if (!ActiveVideoSource.value) {
    return;
  }

  try {
    if (SourceBeforeScreenShare.value && ScreenShareSource.value) {
      // turn off screen share
      const track = getTrack(ScreenShareSource.value)
      track.removeEventListener("ended", toggleScreenShare);
      track.enabled = false;
      track.stop();
      getTrack(SourceBeforeScreenShare.value).enabled = true;
      ActiveVideoSource.value = SourceBeforeScreenShare.value;
      SourceBeforeScreenShare.value = undefined;
      ScreenShareSource.value = undefined;
    } else {
      // turn on screen share
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });
      getTrack(ActiveVideoSource.value).enabled = false
      SourceBeforeScreenShare.value = ActiveVideoSource.value;
      ActiveVideoSource.value = stream;
      ScreenShareSource.value = stream;
      getTrack(stream).addEventListener("ended", toggleScreenShare);
    }
  } catch (e) {
    notification.notify(
      `Failed to toggle screen share: ${(e as Error).message}`
    );
    return;
  }

  if (!Live.value) {
    return;
  }

  try {
    await Client.ReplaceVideoTrack(ActiveVideoSource.value);
  } catch (e) {
    notification.notify(
      `Failed to change stream source: ${(e as Error).message}`
    );
  }
}

const hasRearCamera = computed(() => {
  return typeof RearCamera.value !== "undefined";
});
async function toggleCameraSource() {
  if (!RearCamera.value || !VideoSource.value) {
    return;
  }

  if (CurrentSource.value === "Rear") {
    getTrack(RearCamera.value).enabled = false
    getTrack(VideoSource.value).enabled = true
    ActiveVideoSource.value = VideoSource.value;
  } else {
    getTrack(VideoSource.value).enabled = false
    getTrack(RearCamera.value).enabled = true
    ActiveVideoSource.value = RearCamera.value;
  }

  if (!Live.value) {
    return;
  }

  try {
    await Client.ReplaceVideoTrack(ActiveVideoSource.value);
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
    getTrack(backCamera).enabled = false
    RearCamera.value = backCamera;
  } catch (e) {
    if ((e as Error).name === "OverconstrainedError") {
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
      facingMode: "user",
    },
  };

  clearAlert();
  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    VideoSource.value = stream;
    ActiveVideoSource.value = stream;
    await findRearCamera();
  } catch (e) {
    setAlert("fail", `Permission error: ${(e as Error).message}`);
  }
}

function toggleVideoEnabled() {
  if (!ActiveVideoSource.value) {
    return;
  }
  const track = getTrack(ActiveVideoSource.value)
  VideoEnabled.value = track.enabled = !track.enabled;
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
    const track = getTrack(AudioSource.value)
    AudioEnabled.value = track.enabled = !track.enabled;
  }
}

async function publish() {
  if (Disabled.value) {
    return;
  }
  if (!ActiveVideoSource.value || !AudioSource.value) {
    return;
  }
  clearAlert();
  try {
    Disabled.value = true;

    await Client.WithEndpoint(Endpoint.value, setting.trickle);

    const src = new MediaStream();
    const videoTrack = getTrack(ActiveVideoSource.value)
    console.log(videoTrack.getSettings());
    const audioTrack = getTrack(AudioSource.value)
    console.log(audioTrack.getSettings());
    src.addTrack(videoTrack);
    src.addTrack(audioTrack);
    await Client.Publish(src);

    await nextTick();
    setting.lastLive = Endpoint.value;
    HideHeader.value = true;
    Live.value = true;
  } catch (e) {
    Disabled.value = false;
    setAlert("fail", (e as Error).message);
  }
}

function stopAllSources() {
  const sources = [
    RearCamera.value,
    VideoSource.value,
    AudioSource.value,
    ScreenShareSource.value,
  ];
  for (const source of sources) {
    if (!source) {
      continue;
    }
    const track = getTrack(source)
    track.enabled = false;
    track.stop();
  }
}

async function end() {
  if (!Live.value) {
    return;
  }
  try {
    await Client.Disconnect();
    notification.notify("Livestream ended");

    await nextTick();
    Disabled.value = false;
    Live.value = false;
  } catch (e) {
    notification.notify(`Fail to end livestream: ${(e as Error).message}`);
  }
}

onMounted(async () => {
  Client.addEventListener("log", (ev) => {
    const now = new Date().toLocaleString();
    Logs.value.push(`${now}: ${ev.detail.message}`);
  });
  Client.addEventListener("status", (ev) => {
    switch (ev.detail.status) {
      case "disconnected":
        Live.value = false;
        setAlert("info", "Disconnected from stream");
        break;
    }
  });
  Endpoint.value = setting.lastLive;

  watchEffect(() => {
    if (!VideoPreview.value) {
      return;
    }
    // eslint-disable-next-line no-undef
    VideoPreview.value.srcObject = ActiveVideoSource.value as MediaProvider;
  });

  watchEffect(() => {
    if (readyToGoLive.value) {
      BounceIcon.value = true;
      setTimeout(() => {
        BounceIcon.value = false;
      }, 2000);
    } else {
      BounceIcon.value = false;
    }
  });
});

onUnmounted(async () => {
  stopAllSources();
  await end();
});
</script>

<template>
  <main>
    <transition
      enter-active-class="transform ease-out duration-500 transition"
      enter-from-class="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
      enter-to-class="translate-y-0 opacity-100 sm:translate-x-0"
      leave-active-class="transition ease-in duration-300"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
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
    </transition>

    <div class="box pt-6">
      <div class="box-wrapper">
        <AddressBar
          placeholder="WHIP Endpoint"
          :action="publish"
          :blur="Live && CurrentSource === 'Screen'"
          :disabled="Disabled || !readyToGoLive"
          :value="Endpoint"
          @update:value="Endpoint = $event"
        >
          <SignalIcon
            :class="[
              Disabled || !readyToGoLive
                ? 'cursor-not-allowed'
                : 'cursor-pointer',
              BounceIcon ? 'animate-ping' : '',
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
                You are ready to go live!
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
                First, choose sources
              </h3>
              <p class="mt-2 text-sm text-gray-600">
                <StatusBadge
                  :text="CurrentSource"
                  :enabled="hasVideo && VideoEnabled"
                >
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
              </p>
              <p class="mt-2 text-sm text-gray-600">
                <StatusBadge
                  :text="(hasRearCamera ? 'Has' : 'No') + ' Rear Camera'"
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
                  class="space-y-6 bg-white dark:bg-slate-800 px-4 py-5 sm:p-6 text-center xl:text-justify"
                >
                  <div>
                    <span
                      class="isolate inline-flex rounded-md shadow-sm"
                      v-show="!readyToGoLive"
                    >
                      <button
                        type="button"
                        @click="getVideo"
                        class="relative inline-flex items-center rounded-l-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 px-4 py-2 text-sm font-medium dark:text-gray-200 dark:hover:bg-gray-600 hover:bg-gray-100 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        Get Camera Permission
                      </button>
                      <button
                        type="button"
                        @click="getAudio"
                        class="relative -ml-px inline-flex items-center rounded-r-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 px-4 py-2 text-sm font-medium dark:text-gray-200 dark:hover:bg-gray-600 hover:bg-gray-100 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
                        @click="toggleVideoEnabled"
                        class="relative inline-flex items-center rounded-l-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 px-4 py-2 text-sm font-medium dark:text-gray-200 dark:hover:bg-gray-600 hover:bg-gray-100 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        Turn {{ VideoEnabled ? "off" : "on " }} Video
                      </button>
                      <button
                        type="button"
                        @click="toggleCameraSource"
                        v-show="
                          hasRearCamera && CurrentSource !== 'Screen'
                        "
                        :disabled="!VideoEnabled"
                        :class="[
                          VideoEnabled
                            ? 'cursor-pointer'
                            : 'cursor-not-allowed',
                          'relative -ml-px inline-flex items-center border border-gray-300 dark:border-gray-600 dark:bg-gray-700 px-4 py-2 text-sm font-medium dark:text-gray-200 dark:hover:bg-gray-600 hover:bg-gray-100 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500',
                        ]"
                      >
                        Use
                        {{ CurrentSource === "Rear" ? "front" : "rear " }}
                        Camera
                      </button>
                      <button
                        type="button"
                        @click="toggleScreenShare"
                        v-show="hasScreenShare"
                        :disabled="!VideoEnabled"
                        :class="[
                          VideoEnabled
                            ? 'cursor-pointer'
                            : 'cursor-not-allowed',
                          'relative -ml-px inline-flex items-center border border-gray-300 dark:border-gray-600 dark:bg-gray-700 px-4 py-2 text-sm font-medium dark:text-gray-200 dark:hover:bg-gray-600 hover:bg-gray-100 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500',
                        ]"
                      >
                        {{
                          CurrentSource === "Screen"
                            ? "Stop Screen Share"
                            : "Screen Share"
                        }}
                      </button>
                      <button
                        type="button"
                        @click="toggleAudio"
                        class="relative -ml-px inline-flex items-center rounded-r-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 px-4 py-2 text-sm font-medium dark:text-gray-200 dark:hover:bg-gray-600 hover:bg-gray-100 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
