const CHANNEL_NAME = "apcon-storyblok-dev-sync";
export const STORYBLOK_DEV_SYNC_STORAGE_KEY = "apcon-storyblok-dev-sync";

export type StoryblokDevSyncMessage = {
    type: "saved";
    slug: string;
};

export const isStoryblokDevAutoSyncEnabled = () =>
    import.meta.env.DEV &&
    import.meta.env.PUBLIC_STORYBLOK_DEV_AUTO_SYNC !== "false" &&
    import.meta.env.NUXT_PUBLIC_STORYBLOK_DEV_AUTO_SYNC !== "false";

export const notifyStoryblokStorySaved = (slug: string) => {
    if (typeof window === "undefined" || !isStoryblokDevAutoSyncEnabled()) {
        return;
    }

    const message: StoryblokDevSyncMessage = { type: "saved", slug };

    try {
        const channel = new BroadcastChannel(CHANNEL_NAME);
        channel.postMessage(message);
        window.setTimeout(() => channel.close(), 0);
    } catch {
        // BroadcastChannel unavailable — localStorage + CDN poll still run.
    }

    try {
        localStorage.setItem(STORYBLOK_DEV_SYNC_STORAGE_KEY, JSON.stringify({ slug, t: Date.now() }));
    } catch {
        // Ignore private browsing / storage quota errors.
    }
};

export const subscribeToStoryblokStorySaved = (callback: (slug: string) => void) => {
    if (typeof window === "undefined" || !isStoryblokDevAutoSyncEnabled()) {
        return () => {};
    }

    try {
        const channel = new BroadcastChannel(CHANNEL_NAME);
        const handler = (event: MessageEvent<StoryblokDevSyncMessage>) => {
            if (event.data?.type === "saved" && typeof event.data.slug === "string") {
                callback(event.data.slug);
            }
        };

        channel.addEventListener("message", handler);

        return () => {
            channel.removeEventListener("message", handler);
            channel.close();
        };
    } catch {
        return () => {};
    }
};

export const getStoryblokAsyncDataKey = (slug: string) => `storyblok-${slug}`;
