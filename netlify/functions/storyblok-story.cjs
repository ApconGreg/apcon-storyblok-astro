const getStoryblokApiBase = (region) => {
    const normalized = (region || "").toLowerCase();

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

exports.handler = async (event) => {
    if (event.httpMethod !== "GET") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    const slug = event.queryStringParameters?.slug;

    if (!slug) {
        return {
            statusCode: 400,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ error: "Missing slug query parameter" }),
        };
    }

    const token =
        process.env.PUBLIC_STORYBLOK_ACCESS_TOKEN ||
        process.env.NUXT_PUBLIC_STORYBLOK_ACCESS_TOKEN ||
        process.env.GATSBY_STORYBLOK_ACCESS_TOKEN ||
        process.env.SB_TOKEN ||
        "";
    const version =
        process.env.PUBLIC_STORYBLOK_VERSION ||
        process.env.NUXT_PUBLIC_STORYBLOK_VERSION ||
        process.env.GATSBY_STORYBLOK_VERSION ||
        process.env.SB_VERSION ||
        "draft";
    const region =
        process.env.PUBLIC_STORYBLOK_REGION ||
        process.env.NUXT_PUBLIC_STORYBLOK_REGION ||
        process.env.GATSBY_STORYBLOK_REGION ||
        process.env.SB_REGION ||
        "";

    if (!token) {
        return {
            statusCode: 500,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ error: "Storyblok access token is not configured" }),
        };
    }

    const apiBase = getStoryblokApiBase(region);
    const storyUrl = `${apiBase}/v2/cdn/stories/${slug}?version=${encodeURIComponent(version)}&token=${encodeURIComponent(token)}`;

    try {
        const response = await fetch(storyUrl);

        if (!response.ok) {
            return {
                statusCode: response.status,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    error: "Storyblok CDN request failed",
                    status: response.status,
                }),
            };
        }

        const data = await response.json();

        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json",
                "Cache-Control": "no-store",
            },
            body: JSON.stringify({
                cv: data.cv ?? null,
                story: data.story
                    ? { id: data.story.id, name: data.story.name, content: data.story.content }
                    : null,
            }),
        };
    } catch (error) {
        return {
            statusCode: 502,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                error: "Failed to fetch story from Storyblok",
                message: error instanceof Error ? error.message : "Unknown error",
            }),
        };
    }
};
