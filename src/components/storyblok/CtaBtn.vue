<script setup lang="ts">
import { Icon } from "@iconify/vue";
import type { StoryblokBlok, StoryblokComponentProps, StoryblokLink } from "./types";
import {
    getButtonClasses,
    resolveBlokClasses,
    resolveStoryblokIcon,
    resolveStoryblokLink,
    resolveStoryblokOptionValue,
    type StoryblokDomFields,
    type StoryblokIconPluginValue,
} from "./utils";

type CtaBtnBlok = StoryblokBlok &
    StoryblokDomFields & {
        cta_label?: string;
        cta_link?: StoryblokLink | string;
        btn_type?: string | { value?: string };
        cta_icon?: StoryblokIconPluginValue;
        cta_size?: string | { value?: string };
    };

const props = defineProps<StoryblokComponentProps<CtaBtnBlok>>();

const href = computed(() => resolveStoryblokLink(props.blok.cta_link));
const btnType = computed(() => resolveStoryblokOptionValue(props.blok.btn_type));
const btnSize = computed(() => resolveStoryblokOptionValue(props.blok.cta_size));
const className = computed(() =>
    [getButtonClasses(btnType.value, btnSize.value), resolveBlokClasses(props.blok)].filter(Boolean).join(" ")
);
const target = computed(() =>
    typeof props.blok.cta_link === "object" && props.blok.cta_link?.target ? props.blok.cta_link.target : undefined
);
const iconName = computed(() => resolveStoryblokIcon(props.blok.cta_icon));
</script>

<template>
    <a
        v-editable="blok"
        :id="blok.id"
        :href="href"
        :class="className"
        :target="target"
        :rel="target === '_blank' ? 'noopener noreferrer' : undefined"
    >
        <span v-if="iconName" class="mr-2 inline-flex" aria-hidden="true">
            <Icon :icon="iconName" />
        </span>
        {{ blok.cta_label || "Learn more" }}
    </a>
</template>
