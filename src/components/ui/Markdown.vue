<script setup lang="ts">
import MarkdownIt from "markdown-it";

const props = withDefaults(
    defineProps<{
        content: string;
        className?: string;
    }>(),
    {
        className: "markdown",
    }
);

const markdown = new MarkdownIt();
const html = computed(() => markdown.render(props.content));
</script>

<template>
    <div :class="className" v-html="html" />
</template>
