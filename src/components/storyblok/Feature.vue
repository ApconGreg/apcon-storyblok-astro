<script setup lang="ts">
import type { StoryblokBlok } from "./types";

defineProps<{
    blok: StoryblokBlok & {
        name?: string;
        description?: string;
    };
}>();
</script>

<template>
    <div v-editable="blok" class="card bg-base-100 shadow-md">
        <div class="card-body">
            <h3 v-if="blok.name" class="card-title">{{ blok.name }}</h3>
            <p v-if="blok.description">{{ blok.description }}</p>
        </div>
    </div>
</template>
