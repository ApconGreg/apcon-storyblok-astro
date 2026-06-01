import type { Component } from "vue";
import type { StoryblokBlok } from "~/components/storyblok/types";

const STORYBLOK_MODULE_BLOCKLIST = new Set([
    "StoryblokPreview",
    "StoryblokLivePreview",
    "StoryblokMissingBlok",
    "StoryblokDevSync",
]);

type StoryblokComponentModule = {
    default?: Component<{ blok: StoryblokBlok }>;
    storyblokComponentName?: string;
};

export const fileNameToStoryblokComponentName = (fileName: string) => {
    const base = fileName.replace(/\.vue$/, "");

    return base
        .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
        .replace(/([A-Z])([A-Z][a-z])/g, "$1-$2")
        .toLowerCase();
};

const modules = import.meta.glob<{ default?: Component<{ blok: StoryblokBlok }>; storyblokComponentName?: string }>(
    "../components/storyblok/[A-Z]*.vue",
    { eager: true }
);

export const storyblokComponents: Record<string, Component<{ blok: StoryblokBlok }>> = {};

for (const [path, moduleExports] of Object.entries(modules)) {
    const moduleName = path.split("/").pop()?.replace(/\.vue$/, "") ?? "";

    if (STORYBLOK_MODULE_BLOCKLIST.has(moduleName)) {
        continue;
    }

    const typedModule = moduleExports as StoryblokComponentModule;

    if (!typedModule.default) {
        continue;
    }

    const componentName =
        typedModule.storyblokComponentName ?? fileNameToStoryblokComponentName(`${moduleName}.vue`);

    storyblokComponents[componentName] = typedModule.default;
}

export const storyblokComponentNames = Object.keys(storyblokComponents);
