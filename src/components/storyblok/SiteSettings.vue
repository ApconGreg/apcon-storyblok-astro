<script setup lang="ts">
import type { StoryblokAsset, StoryblokComponentProps } from "./types";

type SiteSettingsBlok = {
    _uid: string;
    component: string;
    site_name?: string;
    phone?: string;
    email?: string;
    logo_header?: StoryblokAsset;
    logo_footer?: StoryblokAsset;
};

defineProps<StoryblokComponentProps<SiteSettingsBlok>>();
</script>

<template>
    <div v-editable="blok" class="hidden" aria-hidden="true">
        {{ blok.site_name }}
    </div>
</template>
