import {
    getStoryblokAccessToken,
    getStoryblokRegion,
    getStoryblokVersion,
    isStoryblokLivePreviewEnabled,
} from "@config/storyblok-env";

export type SiteConfig = {
    siteUrl: string;
    siteTitle: string;
    siteDescription: string;
    storyblokAccessToken: string;
    storyblokVersion: string;
    storyblokRegion: string;
    storyblokLivePreview: boolean;
    storyblokDevPollMs: number;
    storyblokDevAutoSync: boolean;
    storyblokLivePreviewPollMs: number;
    storyblokBridgeResolveLinks: string;
    gtmId: string;
    oneTrustDomainScript: string;
    hubspotPortalId: string;
    cloudinaryCloudName: string;
};

const readEnv = (keys: string[], fallback = "") => {
    for (const key of keys) {
        const value = import.meta.env[key];
        if (typeof value === "string" && value.length > 0) {
            return value;
        }
    }

    return fallback;
};

export const getSiteConfig = (): SiteConfig => ({
    siteUrl: readEnv(["PUBLIC_SITE_URL", "NUXT_PUBLIC_SITE_URL", "GATSBY_SITE_URL"], "https://localhost:3000"),
    siteTitle: readEnv(["PUBLIC_SITE_TITLE", "NUXT_PUBLIC_SITE_TITLE", "GATSBY_SITE_TITLE"], "APCON"),
    siteDescription: readEnv(
        ["PUBLIC_SITE_DESCRIPTION", "NUXT_PUBLIC_SITE_DESCRIPTION", "GATSBY_SITE_DESCRIPTION"],
        "APCON website powered by Storyblok"
    ),
    storyblokAccessToken: getStoryblokAccessToken(),
    storyblokVersion: getStoryblokVersion(),
    storyblokRegion: getStoryblokRegion(),
    storyblokLivePreview: isStoryblokLivePreviewEnabled(),
    storyblokDevPollMs: Number(readEnv(["PUBLIC_STORYBLOK_DEV_POLL_MS", "NUXT_PUBLIC_STORYBLOK_DEV_POLL_MS"], "1000")),
    storyblokDevAutoSync: readEnv(["PUBLIC_STORYBLOK_DEV_AUTO_SYNC", "NUXT_PUBLIC_STORYBLOK_DEV_AUTO_SYNC"]) !== "false",
    storyblokLivePreviewPollMs: Number(
        readEnv(["PUBLIC_STORYBLOK_LIVE_PREVIEW_POLL_MS", "NUXT_PUBLIC_STORYBLOK_LIVE_PREVIEW_POLL_MS"], "3000")
    ),
    storyblokBridgeResolveLinks: readEnv(
        ["PUBLIC_STORYBLOK_BRIDGE_RESOLVE_LINKS", "NUXT_PUBLIC_STORYBLOK_BRIDGE_RESOLVE_LINKS"],
        "0"
    ),
    gtmId: readEnv(["PUBLIC_GTM_ID", "NUXT_PUBLIC_GTM_ID", "GATSBY_GTM_ID"]),
    oneTrustDomainScript: readEnv(
        ["PUBLIC_ONETRUST_DOMAIN_SCRIPT", "NUXT_PUBLIC_ONETRUST_DOMAIN_SCRIPT", "GATSBY_ONETRUST_DOMAIN_SCRIPT"]
    ),
    hubspotPortalId: readEnv(["PUBLIC_HUBSPOT_PORTAL_ID", "NUXT_PUBLIC_HUBSPOT_PORTAL_ID", "GATSBY_HUBSPOT_PORTAL_ID"]),
    cloudinaryCloudName: readEnv(
        ["PUBLIC_CLOUDINARY_CLOUD_NAME", "NUXT_PUBLIC_CLOUDINARY_CLOUD_NAME", "GATSBY_CLOUDINARY_CLOUD_NAME"]
    ),
});

export const siteConfig = getSiteConfig();

export const publicSiteConfig = {
    siteUrl: siteConfig.siteUrl,
    siteTitle: siteConfig.siteTitle,
    siteDescription: siteConfig.siteDescription,
    storyblokAccessToken: siteConfig.storyblokAccessToken,
    storyblokVersion: siteConfig.storyblokVersion,
    storyblokRegion: siteConfig.storyblokRegion,
    storyblokLivePreview: siteConfig.storyblokLivePreview,
    storyblokDevPollMs: siteConfig.storyblokDevPollMs,
    storyblokDevAutoSync: siteConfig.storyblokDevAutoSync,
    storyblokLivePreviewPollMs: siteConfig.storyblokLivePreviewPollMs,
    storyblokBridgeResolveLinks: siteConfig.storyblokBridgeResolveLinks,
    gtmId: siteConfig.gtmId,
    oneTrustDomainScript: siteConfig.oneTrustDomainScript,
    hubspotPortalId: siteConfig.hubspotPortalId,
    cloudinaryCloudName: siteConfig.cloudinaryCloudName,
};
