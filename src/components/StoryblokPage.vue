<script setup lang="ts">
import AppLayout from "~/components/layout/AppLayout.vue";
import StoryblokPreview from "~/components/storyblok/StoryblokPreview.vue";
import { useAppSeo } from "~/composables/useAppSeo";
import type { StoryblokCdnStory } from "~/utils/storyblok-cdn";

const props = defineProps<{
    slug: string;
    title?: string;
    pathname?: string;
    initialStory?: StoryblokCdnStory | null;
}>();

const lastKnownStory = shallowRef<StoryblokCdnStory | null>(props.initialStory ?? null);

watch(
    () => props.initialStory,
    (value) => {
        if (value) {
            lastKnownStory.value = value;
        }
    },
    { immediate: true }
);

useAppSeo({
    title: () => lastKnownStory.value?.name || props.title || "Page",
    pathname: () => props.pathname || "/",
});

const previewStory = computed(() => {
    const current = lastKnownStory.value;

    if (!current) {
        return null;
    }

    return {
        id: current.id,
        name: current.name,
        content: current.content,
    };
});
</script>

<template>
    <AppLayout>
        <div v-if="!previewStory" class="container mx-auto px-4 py-16">
            <div class="alert alert-warning max-w-2xl">
                <span>No Storyblok entry found for slug: {{ slug }}</span>
            </div>
        </div>
        <StoryblokPreview v-else :story="previewStory" :slug="slug" />
    </AppLayout>
</template>
