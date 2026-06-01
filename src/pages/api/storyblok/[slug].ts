import type { APIRoute } from "astro";
import {
    getStoryblokAccessToken,
    getStoryblokRegion,
    getStoryblokVersion,
} from "@config/storyblok-env";
import { getStoryblokApiBase, parseStoryblokCdnResponse } from "~/utils/storyblok-cdn";

export const GET: APIRoute = async ({ params }) => {
    const slug = params.slug;

    if (!slug) {
        return new Response(JSON.stringify({ error: "Missing slug" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
        });
    }

    const token = getStoryblokAccessToken();

    if (!token) {
        return new Response(JSON.stringify({ error: "Storyblok token not configured" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }

    const version = getStoryblokVersion() || "draft";
    const region = getStoryblokRegion();

    const response = await fetch(
        `${getStoryblokApiBase(region)}/v2/cdn/stories/${encodeURIComponent(slug)}?version=${encodeURIComponent(version)}&token=${encodeURIComponent(token)}`,
        { cache: "no-store" }
    );

    if (!response.ok) {
        return new Response(JSON.stringify({ error: "Storyblok CDN request failed" }), {
            status: response.status,
            headers: { "Content-Type": "application/json" },
        });
    }

    const story = parseStoryblokCdnResponse(await response.text());

    if (!story) {
        return new Response(JSON.stringify({ error: "Story not found" }), {
            status: 404,
            headers: { "Content-Type": "application/json" },
        });
    }

    return new Response(JSON.stringify(story), {
        status: 200,
        headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store, no-cache, must-revalidate",
        },
    });
};
