<script setup lang="ts">
import { StoryblokComponent } from "@storyblok/vue";
import type { StoryblokAsset, StoryblokBlok, StoryblokComponentProps } from "./types";
import {
    getNestedBloks,
    getRestrictClass,
    getSpacingClass,
    resolveBgColorClass,
    resolveBlokClasses,
    resolveSectionBackgroundStyle,
    type StoryblokColorPluginValue,
    type StoryblokDomFields,
} from "./utils";

type SectionBlok = StoryblokBlok &
    StoryblokDomFields & {
        section_content?: StoryblokBlok[];
        content?: StoryblokBlok[];
        body?: StoryblokBlok[];
        blocks?: StoryblokBlok[];
        restrict?: string | boolean;
        spacing?: string;
        bg_color?: StoryblokColorPluginValue;
        bg_img?: StoryblokAsset;
        bg_blend?: string | { value?: string };
    };

const props = defineProps<StoryblokComponentProps<SectionBlok>>();

const sectionNestFields = ["section_content", "content", "body", "blocks"];
const spacingClass = computed(() => getSpacingClass(props.blok.spacing));
const restrictClass = computed(() => getRestrictClass(props.blok.restrict));
const nestedBloks = computed(() => getNestedBloks(props.blok, sectionNestFields));
const bgColorClass = computed(() => resolveBgColorClass(props.blok.bg_color));
const sectionBackgroundStyle = computed(() =>
    resolveSectionBackgroundStyle(props.blok.bg_img, props.blok.bg_blend, props.blok.bg_color)
);
</script>

<template>
    <section
        v-editable="blok"
        :id="blok.id"
        :style="sectionBackgroundStyle"
        :class="[resolveBlokClasses(blok), spacingClass, bgColorClass].filter(Boolean).join(' ')"
    >
        <div :class="[restrictClass].filter(Boolean).join(' ')">
            <StoryblokComponent v-for="nestedBlok in nestedBloks" :key="nestedBlok._uid" :blok="nestedBlok" />
        </div>
    </section>
</template>
