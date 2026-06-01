<script setup lang="ts">
import { StoryblokComponent } from "@storyblok/vue";
import type { StoryblokBlok, StoryblokComponentProps } from "./types";

type GridBlok = StoryblokBlok & {
    columns?: StoryblokBlok[];
};

defineProps<StoryblokComponentProps<GridBlok>>();
</script>

<template>
    <div v-editable="blok" class="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <StoryblokComponent v-for="nestedBlok in blok.columns || []" :key="nestedBlok._uid" :blok="nestedBlok" />
    </div>
</template>
