<script setup lang="ts">
import { StoryblokComponent } from "@storyblok/vue";
import type { StoryblokBlok, StoryblokComponentProps } from "./types";
import { getGridColumnsClass, getSpacingClass, resolveBlokClasses, type StoryblokDomFields } from "./utils";

type CardsBlok = StoryblokBlok &
    StoryblokDomFields & {
        the_cards?: StoryblokBlok[];
        cards_columns?: string | number;
        cards_spacing?: string;
    };

const props = defineProps<StoryblokComponentProps<CardsBlok>>();

const columnsClass = computed(() => getGridColumnsClass(props.blok.cards_columns));
const spacingClass = computed(() => getSpacingClass(props.blok.cards_spacing));
</script>

<template>
    <div
        v-editable="blok"
        :id="blok.id"
        :class="['grid', columnsClass, spacingClass, resolveBlokClasses(blok)].filter(Boolean).join(' ')"
    >
        <StoryblokComponent v-for="nestedBlok in blok.the_cards || []" :key="nestedBlok._uid" :blok="nestedBlok" />
    </div>
</template>
