<script setup lang="ts">
import type { StoryblokBlok } from "./types";

defineProps<{
    blok: StoryblokBlok;
}>();
</script>

<template>
    <div class="alert alert-warning my-4" role="alert" :data-missing-storyblok-component="blok.component">
        <p>
            Storyblok component <strong>{{ blok.component }}</strong> is not registered in
            <code>app/utils/storyblok-components.ts</code>.
        </p>
        <p class="text-sm opacity-80">
            Add a matching Vue component and restart <code>pnpm dev</code>.
        </p>
    </div>
</template>
