<script setup lang="ts">
import { useNotificationStore } from "@/store/notification";
import { useSettingStore } from "@/store/setting";

import { ref, onUnmounted, onMounted, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";
import type { Ref } from "vue";

import AddressBar from "@/components/AddressBar.vue";
import AccordionSection from "@/components/AccordionSection.vue";
import AlertSection from "@/components/AlertSection.vue";
import HorizontalDivider from "@/components/HorizontalDivider.vue";
import SpinnerIcon from "@/components/SpinnerIcon.vue";
import { PlayIcon } from "@heroicons/vue/24/outline";

import { WISH } from "@/lib/wish";
import type { AlertLevel } from "@/types/level";

const notification = useNotificationStore();
const setting = useSettingStore();

const Endpoint = ref("");
const Disabled = ref(false);
const Logs: Ref<string[]> = ref([]);

const Client = new WISH();
const Media: Ref<MediaStream | undefined> = ref();
const ShowControl = ref(false);
const HideHeader = ref(false);
const Playing = ref(false);

const route = useRoute();
const router = useRouter();

const AlertMessage = ref("");
const MessageLevel: Ref<AlertLevel> = ref("info");
function setAlert(level: AlertLevel, msg: string) {
  MessageLevel.value = level;
  AlertMessage.value = msg;
}
function clearAlert() {
  AlertMessage.value = "";
}

async function play() {
  if (Disabled.value) {
    return;
  }
  Media.value = undefined;
  clearAlert();

  Disabled.value = true;
  try {
    ShowControl.value = false;

    if (Playing.value) {
      try {
        await Client.Disconnect();
      } catch (e) {
        notification.notify(
          `Error disconnecting previous stream: ${(e as Error).message}`
        );
      }
    }
    await Client.WithEndpoint(Endpoint.value, setting.trickle);

    const dst = await Client.Play();
    Media.value = dst;

    await nextTick();
    ShowControl.value = true;
    HideHeader.value = true;
    Playing.value = true;
    router.push({
      query: {
        v: Endpoint.value,
      },
    });
  } catch (e) {
    setAlert("fail", (e as Error).message);
    Playing.value = false;
  }
  await nextTick();
  Disabled.value = false;
}

onMounted(() => {
  Client.addEventListener("log", (ev) => {
    const now = new Date().toLocaleString();
    Logs.value.push(`${now}: ${ev.detail.message}`);
  });
  Client.addEventListener("status", (ev) => {
    switch (ev.detail.status) {
      case "disconnected":
        Playing.value = false;
        Disabled.value = false;
        setAlert("info", "Disconnected from stream");
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
    await Client.Disconnect();
    notification.notify("Stream disconnected");
  } catch (e) {
    notification.notify(`Fail to disconnect stream: ${(e as Error).message}`);
  }
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
          Watch via
          <a
            href="https://datatracker.ietf.org/doc/draft-murillo-whep/"
            target="_blank"
            >WHEP</a
          >
        </h1>
        <p class="font-base text-base text-gray-600 dark:text-gray-500">
          Play an WebRTC stream with sub-second latency
        </p>
      </div>
    </transition>

    <div class="box pt-6">
      <div class="box-wrapper">
        <AddressBar
          :action="play"
          placeholder="WHEP Endpoint"
          :disabled="Disabled"
          :value="Endpoint"
          @update:value="Endpoint = $event"
        >
          <SpinnerIcon v-show="Disabled" class="w-8 h-8 cursor-not-allowed" />
          <PlayIcon
            v-show="!Disabled"
            class="w-8 h-8 text-gray-600 dark:text-gray-400 cursor-pointer"
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

      <section id="player-container" class="justify-center items-center flex">
        <video
          v-show="Media"
          :srcObject="Media"
          :controls="ShowControl"
          class="w-full h-auto"
          autoplay
          playsinline
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
  </main>
</template>
