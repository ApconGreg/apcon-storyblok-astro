<script setup lang="ts">
import { StoryblokComponent } from "@storyblok/vue";
import type { StoryblokBlok, StoryblokComponentProps } from "./types";
import { getNestedBloks, resolveBlokClasses, type StoryblokDomFields } from "./utils";

type PageBlok = StoryblokBlok &
    StoryblokDomFields & {
        blocks?: StoryblokBlok[];
        body?: StoryblokBlok[];
    };

defineProps<StoryblokComponentProps<PageBlok>>();

const nestedFieldNames = ["body", "blocks"];
</script>

<template>
    <main v-editable="blok" :id="blok.id" :class="resolveBlokClasses(blok)">
        <StoryblokComponent
            v-for="nestedBlok in getNestedBloks(blok, nestedFieldNames)"
            :key="nestedBlok._uid"
            :blok="nestedBlok"
        />
    </main>
</template>
