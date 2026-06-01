<script setup lang="ts">
import { renderRichText, StoryblokComponent } from "@storyblok/vue";
import type { StoryblokBlok, StoryblokComponentProps, StoryblokRichtext } from "./types";
import { resolveBlokClasses, type StoryblokDomFields } from "./utils";

type CardBlok = StoryblokBlok &
    StoryblokDomFields & {
        card_heading?: string;
        card_subheading?: string;
        card_content?: StoryblokRichtext;
        card_cta?: StoryblokBlok[];
    };

const props = defineProps<StoryblokComponentProps<CardBlok>>();

const renderedContent = computed(() =>
    props.blok.card_content ? renderRichText(props.blok.card_content) : null
);
</script>

<template>
    <article
        v-editable="blok"
        :id="blok.id"
        :class="['card test bg-base-100 shadow-md', resolveBlokClasses(blok)].filter(Boolean).join(' ')"
    >
        <div class="card-body">
            <p v-if="blok.card_subheading" class="text-sm font-medium uppercase tracking-wide opacity-70">
                {{ blok.card_subheading }}
            </p>
            <h3 v-if="blok.card_heading" class="card-title">{{ blok.card_heading }}</h3>
            <div
                v-if="renderedContent"
                class="prose prose-sm max-w-none"
                v-html="renderedContent"
            />
            <StoryblokComponent v-for="nestedBlok in blok.card_cta || []" :key="nestedBlok._uid" :blok="nestedBlok" />
        </div>
    </article>
</template>
