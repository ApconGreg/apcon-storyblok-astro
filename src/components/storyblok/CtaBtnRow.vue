<script setup lang="ts">
import { StoryblokComponent } from "@storyblok/vue";
import type { StoryblokBlok, StoryblokComponentProps } from "./types";
import { getBtnRowSpacingClass, resolveBlokClasses, type StoryblokDomFields, type StoryblokMultiOptionValue } from "./utils";

type CtaBtnRowBlok = StoryblokBlok &
    StoryblokDomFields & {
        the_buttons?: StoryblokBlok[];
        btn_row_spacing?: StoryblokMultiOptionValue;
    };

defineProps<StoryblokComponentProps<CtaBtnRowBlok>>();
</script>

<template>
    <div
        v-editable="blok"
        :id="blok.id"
        :class="[
            'btn-row flex flex-wrap gap-3',
            getBtnRowSpacingClass(blok.btn_row_spacing),
            resolveBlokClasses(blok),
        ]
            .filter(Boolean)
            .join(' ')"
    >
        <StoryblokComponent v-for="nestedBlok in blok.the_buttons || []" :key="nestedBlok._uid" :blok="nestedBlok" />
    </div>
</template>
