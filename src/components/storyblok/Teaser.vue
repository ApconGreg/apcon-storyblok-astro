<script setup lang="ts">
import type { StoryblokBlok } from "./types";

defineProps<{
    blok: StoryblokBlok & {
        headline?: string;
        description?: string;
    };
}>();
</script>

<template>
    <section v-editable="blok" class="hero bg-base-200 rounded-box mb-8">
        <div class="hero-content text-center">
            <div class="max-w-2xl">
                <h1 v-if="blok.headline" class="text-4xl font-bold">{{ blok.headline }}</h1>
                <p v-if="blok.description" class="py-6 text-lg">{{ blok.description }}</p>
            </div>
        </div>
    </section>
</template>
