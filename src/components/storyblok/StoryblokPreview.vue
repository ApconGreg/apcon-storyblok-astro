<script setup lang="ts">
import { StoryblokComponent } from "@storyblok/vue";
import { useStoryblokCdnPoll } from "~/composables/useStoryblokCdnPoll";
import {
    fetchStoryblokStory,
    isVisualEditorContext,
    parseStoryContent,
    serializeStoryContent,
    shouldSyncStoryFromCdn,
} from "~/utils/storyblok-cdn";
import { notifyStoryblokStorySaved } from "~/utils/storyblok-dev-sync";
import { STORYBLOK_DEV_CONTENT_CHANGED_EVENT } from "~/utils/storyblok-dev-sync-runner";
import { normalizeStoryId, storyIdsMatch } from "~/utils/storyblok-id";
import type { StoryblokPreviewStory } from "./types";

type StoryblokBridgeOptions = {
    resolveLinks?: "url" | "story" | "0" | "1" | "link";
    resolveRelations?: string | string[];
    preventClicks?: boolean;
};

type StoryblokBridgeEvent = {
    action: "input" | "change" | "published";
    story?: {
        id: number;
        content: Record<string, unknown>;
    };
    storyId?: number;
};

type StoryblokBridgeInstance = {
    on: (events: string[], callback: (event: StoryblokBridgeEvent) => void) => void;
};

type StoryblokBridgeConstructor = new (options?: StoryblokBridgeOptions) => StoryblokBridgeInstance;

const props = defineProps<{
    story: StoryblokPreviewStory;
    slug: string;
    bridgeOptions?: StoryblokBridgeOptions;
}>();

import { useSiteConfig } from "~/composables/useSiteConfig";

const config = useSiteConfig();

const DEFAULT_BRIDGE_OPTIONS: StoryblokBridgeOptions = {
    resolveLinks: (config.public.storyblokBridgeResolveLinks as StoryblokBridgeOptions["resolveLinks"]) || "0",
    preventClicks: true,
};

const getStoryblokBridge = () =>
    (window as Window & { StoryblokBridge?: StoryblokBridgeConstructor }).StoryblokBridge;

const BRIDGE_SCRIPT_ID = "storyblok-javascript-bridge";
const BRIDGE_SCRIPT_SRC = "https://app.storyblok.com/f/storyblok-v2-latest.js";

const getVisualEditorStoryId = () => {
    const value = new URL(window.location.href).searchParams.get("_storyblok");
    return value ? normalizeStoryId(value) : null;
};

const isUsableStoryContent = (content: Record<string, unknown> | undefined) =>
    Boolean(content && (content.component || content.body || content.blocks));

type StoryblokNestedBlok = {
    component?: string;
    _uid?: string;
};

const getPageBloks = (content: Record<string, unknown>) => {
    const body = content.body;
    const blocks = content.blocks;
    if (Array.isArray(body) && body.length > 0) return body as StoryblokNestedBlok[];
    if (Array.isArray(blocks)) return blocks as StoryblokNestedBlok[];
    return [];
};

const getPageBlokSignature = (content: Record<string, unknown>) =>
    getPageBloks(content)
        .map((blok) => `${blok.component ?? "unknown"}:${blok._uid ?? ""}`)
        .join("|");

const previewContentDiffersFromSaved = (
    previewContent: Record<string, unknown>,
    savedContent: Record<string, unknown>
) => getPageBlokSignature(previewContent) !== getPageBlokSignature(savedContent);

const getBloksMissingFromSaved = (
    previewContent: Record<string, unknown>,
    savedContent: Record<string, unknown>
) => {
    const savedUids = new Set(getPageBloks(savedContent).map((blok) => blok._uid).filter(Boolean));
    return getPageBloks(previewContent).filter((blok) => blok._uid && !savedUids.has(blok._uid));
};

const loadStoryblokBridgeScript = () =>
    new Promise<void>((resolve, reject) => {
        if (getStoryblokBridge()) {
            resolve();
            return;
        }

        const existingScript = document.getElementById(BRIDGE_SCRIPT_ID);
        if (existingScript) {
            existingScript.addEventListener("load", () => resolve(), { once: true });
            existingScript.addEventListener("error", () => reject(new Error("Storyblok bridge failed to load")), {
                once: true,
            });
            return;
        }

        const script = document.createElement("script");
        script.id = BRIDGE_SCRIPT_ID;
        script.src = BRIDGE_SCRIPT_SRC;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Storyblok bridge failed to load"));
        document.head.appendChild(script);
    });

const fetchSavedStoryFromCdn = async (slug: string, attempts = 20, delayMs = 500) => {
    for (let attempt = 0; attempt < attempts; attempt += 1) {
        if (attempt > 0) {
            await new Promise((resolve) => window.setTimeout(resolve, delayMs));
        }
        const fetched = await fetchStoryblokStory(slug, { bustCache: true });
        if (fetched && isUsableStoryContent(fetched.content)) {
            return fetched;
        }
    }
    return null;
};

const liveStory = ref<StoryblokPreviewStory>(props.story);
const inVisualEditor = ref(false);
const useCdnStory = ref(false);
const cdnStory = ref<StoryblokPreviewStory>(props.story);

if (typeof window !== "undefined") {
    inVisualEditor.value = isVisualEditorContext();
    useCdnStory.value = !inVisualEditor.value && shouldSyncStoryFromCdn();
}

const applyLiveStory = (nextStory: StoryblokPreviewStory) => {
    liveStory.value = nextStory;
};

const handleCdnStoryUpdate = (nextStory: StoryblokPreviewStory) => {
    cdnStory.value = nextStory;
    liveStory.value = nextStory;
};

const syncSavedStory = async (
    storyId: string,
    slug: string,
    previewContent?: Record<string, unknown>
) => {
    notifyStoryblokStorySaved(slug);

    if (isUsableStoryContent(previewContent)) {
        applyLiveStory({ id: storyId, content: previewContent as Record<string, unknown> });
    }

    const fetched = await fetchSavedStoryFromCdn(slug);
    if (fetched && isUsableStoryContent(fetched.content)) {
        if (!previewContent || !previewContentDiffersFromSaved(previewContent, fetched.content)) {
            applyLiveStory({ id: storyId, content: fetched.content });
        } else {
            const missingBloks = getBloksMissingFromSaved(previewContent, fetched.content);
            console.error("[Storyblok] Save did not persist to the Storyblok API.", {
                missingBloks: missingBloks.map((blok) => ({ component: blok.component, _uid: blok._uid })),
                hints: [
                    "Check the blok is allowed in the parent field (e.g. page body or section_content).",
                    "Fill required fields on the new blok before saving.",
                    "Empty or invalid nested bloks are often removed silently on save.",
                ],
            });
        }
    }
};

const handleDevContentChanged = (event: Event) => {
    const story = (event as CustomEvent<{ id: string | number; content: Record<string, unknown> }>).detail;
    if (story?.content) {
        handleCdnStoryUpdate({ id: story.id, content: story.content });
    }
};

onMounted(async () => {
    if (inVisualEditor.value) {
        const fetched = await fetchStoryblokStory(props.slug, { bustCache: true });
        if (fetched && isUsableStoryContent(fetched.content)) {
            applyLiveStory({ id: fetched.id, content: fetched.content });
        }

        const pageStoryId = normalizeStoryId(props.story.id);
        const visualEditorStoryId = getVisualEditorStoryId();
        const bridgeStoryId = visualEditorStoryId ?? pageStoryId;

        if (!bridgeStoryId) {
            console.warn("[Storyblok] Visual Editor bridge not connected: missing story id.");
            return;
        }

        if (visualEditorStoryId && pageStoryId && !storyIdsMatch(visualEditorStoryId, pageStoryId)) {
            console.warn("[Storyblok] Preview story id differs from Visual Editor id; using editor id for bridge.", {
                visualEditorStoryId,
                pageStoryId,
            });
        }

        try {
            await loadStoryblokBridgeScript();
            const Bridge = getStoryblokBridge();
            if (!Bridge) return;

            const bridge = new Bridge(props.bridgeOptions || DEFAULT_BRIDGE_OPTIONS);
            bridge.on(["input", "change", "published"], (event: StoryblokBridgeEvent) => {
                const eventStoryId = normalizeStoryId(event.story?.id ?? event.storyId);
                if (
                    event.action === "input" &&
                    storyIdsMatch(eventStoryId, bridgeStoryId) &&
                    event.story?.content
                ) {
                    applyLiveStory({ id: bridgeStoryId, content: event.story.content });
                    return;
                }
                if (
                    (event.action === "change" || event.action === "published") &&
                    storyIdsMatch(eventStoryId, bridgeStoryId)
                ) {
                    void syncSavedStory(bridgeStoryId, props.slug, event.story?.content);
                }
            });
        } catch {
            // Bridge unavailable outside Visual Editor.
        }
        return;
    }

    if (useCdnStory.value) {
        const fetched = await fetchStoryblokStory(props.slug);
        if (fetched) {
            handleCdnStoryUpdate({ id: fetched.id, content: fetched.content });
        }

        window.addEventListener(STORYBLOK_DEV_CONTENT_CHANGED_EVENT, handleDevContentChanged);
    }
});

onUnmounted(() => {
    window.removeEventListener(STORYBLOK_DEV_CONTENT_CHANGED_EVENT, handleDevContentChanged);
});

watch(
    () => props.story,
    (story) => {
        if (!inVisualEditor.value && !useCdnStory.value) {
            liveStory.value = story;
            cdnStory.value = story;
        }
    },
    { deep: true, immediate: true }
);

useStoryblokCdnPoll(
    toRef(props, "slug"),
    liveStory,
    (nextStory) => {
        if (!inVisualEditor.value) {
            handleCdnStoryUpdate(nextStory);
        }
    }
);

const displayStory = computed(() =>
    inVisualEditor.value ? liveStory.value : useCdnStory.value ? cdnStory.value : liveStory.value
);
const blok = computed(() => parseStoryContent(displayStory.value.content));
const blokRenderKey = computed(() =>
    inVisualEditor.value
        ? String(displayStory.value.id)
        : serializeStoryContent(displayStory.value.content)
);
</script>

<template>
    <StoryblokComponent :key="blokRenderKey" :blok="blok" />
</template>
