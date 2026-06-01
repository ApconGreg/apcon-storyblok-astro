import { apiPlugin, StoryblokVue } from "@storyblok/vue";
import type { App } from "vue";
import StoryblokMissingBlok from "~/components/storyblok/StoryblokMissingBlok.vue";
import { isVisualEditorContext } from "~/utils/storyblok-cdn";
import { storyblokComponents } from "~/utils/storyblok-components";
import { getStoryblokDevSyncSlug, startStoryblokDevSync } from "~/utils/storyblok-dev-sync-runner";
import { publicSiteConfig } from "./site-config";

export const setupStoryblokVue = (app: App) => {
    app.component("StoryblokMissingBlok", StoryblokMissingBlok);

    for (const [name, component] of Object.entries(storyblokComponents)) {
        app.component(name, component);
    }

    app.use(StoryblokVue, {
        accessToken: publicSiteConfig.storyblokAccessToken,
        bridge: false,
        use: [apiPlugin],
        apiOptions: {
            accessToken: publicSiteConfig.storyblokAccessToken,
            ...(publicSiteConfig.storyblokRegion ? { region: publicSiteConfig.storyblokRegion } : {}),
        },
        enableFallbackComponent: true,
        customFallbackComponent: "StoryblokMissingBlok",
    });

    if (import.meta.env.DEV) {
        console.info("[Storyblok] Registered components:", Object.keys(storyblokComponents).sort().join(", "));
    }

    if (import.meta.env.DEV && publicSiteConfig.storyblokDevAutoSync !== false && typeof window !== "undefined") {
        if (!isVisualEditorContext()) {
            startStoryblokDevSync({
                getSlug: () => getStoryblokDevSyncSlug(window.location.pathname),
                pollIntervalMs: Number(publicSiteConfig.storyblokDevPollMs || 1000),
            });
        }
    }
};
