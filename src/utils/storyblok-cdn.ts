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

type StoryblokProxyPayload = {
    cv?: number;
    story?: { id?: number | string; name?: string; content: Record<string, unknown> };
    id?: number | string;
    name?: string;
    content?: Record<string, unknown>;
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

export const parseServerProxyResponse = (
    data: StoryblokProxyPayload,
    rawPayload?: string
): StoryblokCdnStory | null => {
    const story = data.story ?? (data.content ? { id: data.id, name: data.name, content: data.content } : null);

    if (!story?.content) {
        return null;
    }

    const id =
        (rawPayload ? extractStoryIdFromCdnPayload(rawPayload) : null) ??
        normalizeStoryId(story.id) ??
        "";

    if (!id) {
        return null;
    }

    return {
        id,
        name: story.name,
        content: story.content,
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

const shouldUseServerStoryProxy = () =>
    typeof window !== "undefined" &&
    (isNetlifyBranchPreviewHost() || isStoryblokLivePreviewEnabled());

const shouldUseDevStoryProxy = () => import.meta.env.DEV && !isNetlifyBranchPreviewHost();

const fetchStoryViaRuntimeConfig = async (
    slug: string,
    _options: FetchStoryblokStoryOptions = {}
): Promise<StoryblokCdnStory | null> => {
    try {
        const token = publicSiteConfig.storyblokAccessToken || getStoryblokAccessToken();
        const version = publicSiteConfig.storyblokVersion || getStoryblokVersion() || "draft";
        const region = publicSiteConfig.storyblokRegion || getStoryblokRegion();

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

const fetchStoryViaServerProxy = async (slug: string): Promise<StoryblokCdnStory | null> => {
    const cacheBust = `_t=${Date.now()}`;
    const endpoints = [
        `/api/storyblok/${encodeURIComponent(slug)}?${cacheBust}`,
        `/.netlify/functions/storyblok-story?slug=${encodeURIComponent(slug)}&${cacheBust}`,
    ];

    for (const endpoint of endpoints) {
        try {
            const response = await fetch(endpoint, { cache: "no-store" });

            if (!response.ok) {
                continue;
            }

            const payload = await response.text();
            const story = parseServerProxyResponse(JSON.parse(payload) as StoryblokProxyPayload, payload);

            if (story) {
                return story;
            }
        } catch {
            // Try the next endpoint.
        }
    }

    return null;
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

        const payload = await response.text();

        return parseServerProxyResponse(JSON.parse(payload) as StoryblokProxyPayload, payload);
    } catch {
        return null;
    }
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

    if (import.meta.env.SSR) {
        return fetchStoryViaRuntimeConfig(slug, options);
    }

    if (shouldUseServerStoryProxy()) {
        return fetchStoryViaServerProxy(slug);
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
