<script setup lang="ts">
import {
    fetchStoryblokStory,
    fetchStoryblokStoryCv,
    serializeStoryContent,
    shouldPollStoryblokCdn,
} from "~/utils/storyblok-cdn";

type StoryblokLivePreviewStory = {
    id: number;
    content: string | Record<string, unknown>;
};

const props = defineProps<{
    slug: string;
    story: StoryblokLivePreviewStory;
}>();

const emit = defineEmits<{
    storyUpdate: [story: StoryblokLivePreviewStory];
}>();

import { publicSiteConfig } from "~/lib/site-config";

const config = { public: publicSiteConfig };
const contentFingerprintRef = ref(serializeStoryContent(props.story.content));

watch(
    () => props.story.content,
    (content) => {
        contentFingerprintRef.value = serializeStoryContent(content);
    }
);

onMounted(() => {
    if (!shouldPollStoryblokCdn()) {
        return;
    }

    let cancelled = false;
    let lastCv: number | null = null;
    let intervalId = 0;
    const pollIntervalMs = import.meta.dev
        ? Number(config.public.storyblokDevPollMs || 1000)
        : Number(config.public.storyblokLivePreviewPollMs || 3000);

    const applyStoryFromCdn = async () => {
        const fetched = await fetchStoryblokStory(props.slug);

        if (cancelled || !fetched) {
            return;
        }

        const nextStory: StoryblokLivePreviewStory = {
            id: fetched.id,
            content: fetched.content,
        };
        const nextFingerprint = serializeStoryContent(nextStory.content);

        if (nextFingerprint !== contentFingerprintRef.value) {
            contentFingerprintRef.value = nextFingerprint;
            emit("storyUpdate", nextStory);
        }
    };

    const syncIfStoryChanged = async (force = false) => {
        if (document.hidden) {
            return;
        }

        const currentCv = await fetchStoryblokStoryCv(props.slug);

        if (currentCv === null) {
            if (force) {
                await applyStoryFromCdn();
            }

            return;
        }

        if (lastCv === null || force) {
            lastCv = currentCv;
            await applyStoryFromCdn();
            return;
        }

        if (currentCv === lastCv) {
            return;
        }

        lastCv = currentCv;
        await applyStoryFromCdn();
    };

    const handleVisibilityChange = () => {
        if (!document.hidden) {
            void syncIfStoryChanged(true);
        }
    };

    void syncIfStoryChanged(true);

    intervalId = window.setInterval(() => {
        void syncIfStoryChanged();
    }, pollIntervalMs);

    document.addEventListener("visibilitychange", handleVisibilityChange);

    onUnmounted(() => {
        cancelled = true;
        window.clearInterval(intervalId);
        document.removeEventListener("visibilitychange", handleVisibilityChange);
    });
});
</script>

<template>
    <span class="hidden" aria-hidden="true" />
</template>
