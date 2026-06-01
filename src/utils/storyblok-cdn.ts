import {
    getStoryblokAccessToken,
    getStoryblokRegion,
    getStoryblokVersion,
    isStoryblokLivePreviewEnabled,
} from "@config/storyblok-env";
import { publicSiteConfig } from "~/lib/site-config";
import { extractStoryIdFromCdnPayload, normalizeStoryId, type StoryblokStoryId } from "~/utils/storyblok-id";

export type StoryblokCdnStory = {
    id: StoryblokStoryId;
    name?: string;
    content: Record<string, unknown>;
    cv?: number;
};

type FetchStoryblokStoryOptions = {
    bustCache?: boolean;
};

export const getStoryblokApiBase = (region?: string) => {
    const normalized = region?.toLowerCase();

    if (normalized === "us") {
        return "https://api-us.storyblok.com";
    }

    if (normalized === "ca") {
        return "https://api-ca.storyblok.com";
    }

    if (normalized === "ap") {
        return "https://api-ap.storyblok.com";
    }

    return "https://api.storyblok.com";
};

export const parseStoryblokCdnResponse = (payload: string): StoryblokCdnStory | null => {
    const data = JSON.parse(payload) as {
        cv?: number;
        story?: { id?: number; name?: string; content: Record<string, unknown> };
    };

    if (!data.story) {
        return null;
    }

    const id =
        extractStoryIdFromCdnPayload(payload) ??
        normalizeStoryId(data.story.id) ??
        "";

    if (!id) {
        return null;
    }

    return {
        id,
        name: data.story.name,
        content: data.story.content,
        cv: data.cv,
    };
};

export const isVisualEditorContext = () => {
    if (typeof window === "undefined") {
        return false;
    }

    const params = new URL(window.location.href).searchParams;

    return params.has("_storyblok_tk") || params.has("_storyblok") || window.self !== window.top;
};

export const getNetlifyBranchPreviewHostname = (hostname?: string): string | null => {
    if (hostname) {
        return hostname;
    }

    if (typeof window !== "undefined") {
        return window.location.hostname;
    }

    return null;
};

export const isNetlifyBranchPreviewHost = (hostname?: string) => {
    const host = hostname ?? getNetlifyBranchPreviewHostname() ?? "";

    return host.startsWith("dev--");
};

export const shouldSyncStoryFromCdn = () => {
    if (typeof window === "undefined") {
        return false;
    }

    if (isVisualEditorContext()) {
        return false;
    }

    return isNetlifyBranchPreviewHost() || import.meta.env.DEV || isStoryblokLivePreviewEnabled();
};

export const shouldPollStoryblokCdn = () => {
    if (typeof window === "undefined") {
        return false;
    }

    if (isVisualEditorContext()) {
        return isNetlifyBranchPreviewHost();
    }

    return shouldSyncStoryFromCdn();
};

const isClient = () => typeof window !== "undefined";

const shouldUseNetlifyStoryProxy = () => isClient() && isNetlifyBranchPreviewHost();

const shouldUseNetlifyStoryApiProxy = (hostname?: string) => import.meta.env.SSR && isNetlifyBranchPreviewHost(hostname);

const shouldUseDevStoryProxy = () => import.meta.env.DEV && !isNetlifyBranchPreviewHost();

const fetchStoryViaRuntimeConfig = async (
    slug: string,
    _options: FetchStoryblokStoryOptions = {}
): Promise<StoryblokCdnStory | null> => {
    try {
        const token = publicSiteConfig.storyblokAccessToken;
        const version = publicSiteConfig.storyblokVersion || "draft";
        const region = publicSiteConfig.storyblokRegion;

        if (!token) {
            return null;
        }

        const response = await fetch(
            `${getStoryblokApiBase(region)}/v2/cdn/stories/${encodeURIComponent(slug)}?version=${encodeURIComponent(version)}&token=${encodeURIComponent(token)}`,
            { cache: "no-store" }
        );

        if (!response.ok) {
            return null;
        }

        return parseStoryblokCdnResponse(await response.text());
    } catch {
        return null;
    }
};

const fetchStoryViaDevProxy = async (
    slug: string,
    options: FetchStoryblokStoryOptions = {}
): Promise<StoryblokCdnStory | null> => {
    try {
        const query = options.bustCache ? `?_t=${Date.now()}` : "";
        const response = await fetch(`/api/storyblok/${encodeURIComponent(slug)}${query}`, {
            cache: "no-store",
        });

        if (!response.ok) {
            return null;
        }

        return (await response.json()) as StoryblokCdnStory;
    } catch {
        return null;
    }
};

const fetchStoryViaNetlifyProxy = async (slug: string): Promise<StoryblokCdnStory | null> => {
    const response = await fetch(
        `/.netlify/functions/storyblok-story?slug=${encodeURIComponent(slug)}&_t=${Date.now()}`,
        { cache: "no-store" }
    );

    if (!response.ok) {
        return null;
    }

    return parseStoryblokCdnResponse(await response.text());
};

export const fetchStoryblokStoryCv = async (slug: string, options?: FetchStoryblokStoryOptions) => {
    const story = await fetchStoryblokStory(slug, options);

    return story?.cv ?? null;
};

export const fetchStoryblokStory = async (
    slug: string,
    options: FetchStoryblokStoryOptions & { hostname?: string } = {}
): Promise<StoryblokCdnStory | null> => {
    if (!slug) {
        return null;
    }

    if (shouldUseNetlifyStoryApiProxy(options.hostname)) {
        return fetchStoryViaDevProxy(slug, options);
    }

    if (shouldUseNetlifyStoryProxy()) {
        return fetchStoryViaNetlifyProxy(slug);
    }

    if (shouldUseDevStoryProxy()) {
        const proxied = await fetchStoryViaDevProxy(slug, options);
        if (proxied) {
            return proxied;
        }

        return fetchStoryViaRuntimeConfig(slug, options);
    }

    const token = getStoryblokAccessToken();
    const version = getStoryblokVersion();
    const region = getStoryblokRegion();

    if (!token) {
        return null;
    }

    const response = await fetch(
        `${getStoryblokApiBase(region)}/v2/cdn/stories/${slug}?version=${version}&token=${token}`,
        { cache: "no-store" }
    );

    if (!response.ok) {
        return null;
    }

    return parseStoryblokCdnResponse(await response.text());
};

export const serializeStoryContent = (content: string | Record<string, unknown>) =>
    typeof content === "string" ? content : JSON.stringify(content);

export const parseStoryContent = (content: string | Record<string, unknown>) => {
    if (typeof content === "string") {
        return JSON.parse(content) as Record<string, unknown>;
    }

    return content;
};
