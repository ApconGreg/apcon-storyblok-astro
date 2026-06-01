<script setup lang="ts">
import { renderRichText, StoryblokComponent } from "@storyblok/vue";
import type { StoryblokBlok, StoryblokComponentProps, StoryblokRichtext } from "./types";
import { resolveBlokClasses, type StoryblokDomFields } from "./utils";

type ContentRowBlok = StoryblokBlok &
    StoryblokDomFields & {
        content?: StoryblokBlok[] | StoryblokRichtext | string;
        restrict?: string | boolean;
    };

const props = defineProps<StoryblokComponentProps<ContentRowBlok>>();

const isStoryblokBlok = (value: unknown): value is StoryblokBlok =>
    Boolean(value && typeof value === "object" && !Array.isArray(value) && "_uid" in value && "component" in value);

const isRichtext = (value: unknown): value is StoryblokRichtext =>
    Boolean(value && typeof value === "object" && !Array.isArray(value) && "type" in value && value.type === "doc");

const restrictClass = computed(() =>
    props.blok.restrict === true || props.blok.restrict === "true" ? "container" : undefined
);

const renderedContent = computed(() => {
    const content = props.blok.content;

    if (!content) {
        return null;
    }

    if (typeof content === "string") {
        return { type: "string" as const, value: content };
    }

    if (Array.isArray(content)) {
        return { type: "bloks" as const, value: content };
    }

    if (isStoryblokBlok(content)) {
        return { type: "single-blok" as const, value: content };
    }

    if (isRichtext(content)) {
        try {
            const renderedRichtext = renderRichText(content);

            if (!renderedRichtext) {
                return null;
            }

            return { type: "richtext" as const, value: renderedRichtext };
        } catch {
            return null;
        }
    }

    return null;
});
</script>

<template>
    <div v-editable="blok" :id="blok.id" :class="resolveBlokClasses(blok)">
        <div :class="restrictClass">
            <div v-if="renderedContent?.type === 'string'" class="prose max-w-none">
                {{ renderedContent.value }}
            </div>
            <template v-else-if="renderedContent?.type === 'bloks'">
                <StoryblokComponent
                    v-for="nestedBlok in renderedContent.value"
                    :key="nestedBlok._uid"
                    :blok="nestedBlok"
                />
            </template>
            <StoryblokComponent
                v-else-if="renderedContent?.type === 'single-blok'"
                :blok="renderedContent.value"
            />
            <div
                v-else-if="renderedContent?.type === 'richtext'"
                class="prose max-w-none"
                v-html="renderedContent.value"
            />
        </div>
    </div>
</template>
