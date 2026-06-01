import { getSlugFromPathname } from "@config/site-pages";
import {
    fetchStoryblokStory,
    isVisualEditorContext,
    serializeStoryContent,
} from "~/utils/storyblok-cdn";
import type { StoryblokCdnStory } from "~/utils/storyblok-cdn";
import {
    STORYBLOK_DEV_SYNC_STORAGE_KEY,
    subscribeToStoryblokStorySaved,
} from "~/utils/storyblok-dev-sync";

export const STORYBLOK_DEV_CONTENT_CHANGED_EVENT = "storyblok-dev-content-changed";

type StartStoryblokDevSyncOptions = {
    getSlug: () => string;
    pollIntervalMs: number;
    onContentChanged?: (story: StoryblokCdnStory) => void;
};

const sleep = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

const waitForStoryContentChange = async (
    slug: string,
    baselineFingerprint: string | null,
    pollIntervalMs = 250,
    maxAttempts = 40
) => {
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
        if (attempt > 0) {
            await sleep(pollIntervalMs);
        }

        const story = await fetchStoryblokStory(slug, { bustCache: true });
        if (!story) {
            continue;
        }

        const nextFingerprint = serializeStoryContent(story.content);
        if (baselineFingerprint === null || nextFingerprint !== baselineFingerprint) {
            return story;
        }
    }

    return null;
};

export const startStoryblokDevSync = ({
    getSlug,
    pollIntervalMs,
    onContentChanged,
}: StartStoryblokDevSyncOptions) => {
    if (typeof window === "undefined" || !import.meta.env.DEV || isVisualEditorContext()) {
        return () => {};
    }

    let cancelled = false;
    let lastFingerprint: string | null = null;
    let pendingReload = false;
    let waitingForSave = false;

    if (import.meta.env.DEV) {
        window.__STORYBLOK_DEV_SYNC_ACTIVE__ = true;
    }

    const applyContentChange = (story: StoryblokCdnStory) => {
        lastFingerprint = serializeStoryContent(story.content);

        window.dispatchEvent(
            new CustomEvent(STORYBLOK_DEV_CONTENT_CHANGED_EVENT, {
                detail: story,
            })
        );

        onContentChanged?.(story);

        if (document.hidden) {
            pendingReload = true;
            return;
        }

        window.location.reload();
    };

    const reloadIfCurrentSlug = (savedSlug: string) => {
        if (savedSlug !== getSlug() || waitingForSave) {
            return;
        }

        waitingForSave = true;

        void (async () => {
            const slug = getSlug();
            const baseline = lastFingerprint;
            const story = await waitForStoryContentChange(slug, baseline, 250, 40);

            waitingForSave = false;

            if (cancelled) {
                return;
            }

            if (story) {
                applyContentChange(story);
            }
        })();
    };

    const unsubscribe = subscribeToStoryblokStorySaved(reloadIfCurrentSlug);

    const handleStorage = (event: StorageEvent) => {
        if (event.key !== STORYBLOK_DEV_SYNC_STORAGE_KEY || !event.newValue) {
            return;
        }

        try {
            const payload = JSON.parse(event.newValue) as { slug?: string };
            if (typeof payload.slug === "string") {
                reloadIfCurrentSlug(payload.slug);
            }
        } catch {
            // Ignore malformed payloads.
        }
    };

    window.addEventListener("storage", handleStorage);

    const syncIfStoryChanged = async () => {
        const slug = getSlug();
        const story = await fetchStoryblokStory(slug, { bustCache: true });

        if (import.meta.env.DEV) {
            window.__STORYBLOK_DEV_SYNC_POLLS__ = (window.__STORYBLOK_DEV_SYNC_POLLS__ ?? 0) + 1;
        }

        if (cancelled || !story) {
            if (import.meta.env.DEV && !story) {
                console.warn(`[Storyblok] Dev sync could not fetch slug "${slug}" from CDN.`);
            }

            return;
        }

        const currentFingerprint = serializeStoryContent(story.content);

        if (lastFingerprint === null) {
            lastFingerprint = currentFingerprint;
            return;
        }

        if (currentFingerprint === lastFingerprint) {
            return;
        }

        applyContentChange(story);
    };

    void syncIfStoryChanged();

    const intervalId = window.setInterval(() => {
        void syncIfStoryChanged();
    }, pollIntervalMs);

    const handleVisibilityChange = () => {
        if (document.hidden) {
            return;
        }

        if (pendingReload) {
            pendingReload = false;
            window.location.reload();
            return;
        }

        void syncIfStoryChanged();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    if (import.meta.env.DEV) {
        console.info("[Storyblok] Plain-tab dev sync active.");
    }

    return () => {
        cancelled = true;
        unsubscribe();
        window.removeEventListener("storage", handleStorage);
        window.clearInterval(intervalId);
        document.removeEventListener("visibilitychange", handleVisibilityChange);

        if (import.meta.env.DEV) {
            window.__STORYBLOK_DEV_SYNC_ACTIVE__ = false;
        }
    };
};

export const getStoryblokDevSyncSlug = (pathname: string) => getSlugFromPathname(pathname) || "home";

declare global {
    interface Window {
        __STORYBLOK_DEV_SYNC_ACTIVE__?: boolean;
        __STORYBLOK_DEV_SYNC_POLLS__?: number;
    }
}
