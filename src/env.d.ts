/// <reference types="astro/client" />

interface ImportMetaEnv {
    readonly PUBLIC_STORYBLOK_ACCESS_TOKEN?: string;
    readonly PUBLIC_STORYBLOK_SPACE_ID?: string;
    readonly PUBLIC_STORYBLOK_VERSION?: string;
    readonly PUBLIC_STORYBLOK_REGION?: string;
    readonly PUBLIC_STORYBLOK_LIVE_PREVIEW?: string;
    readonly PUBLIC_STORYBLOK_DEV_AUTO_SYNC?: string;
    readonly PUBLIC_STORYBLOK_DEV_POLL_MS?: string;
    readonly PUBLIC_STORYBLOK_LIVE_PREVIEW_POLL_MS?: string;
    readonly PUBLIC_STORYBLOK_BRIDGE_RESOLVE_LINKS?: string;
    readonly PUBLIC_SITE_URL?: string;
    readonly PUBLIC_SITE_TITLE?: string;
    readonly PUBLIC_SITE_DESCRIPTION?: string;
    readonly PUBLIC_CLOUDINARY_CLOUD_NAME?: string;
    readonly PUBLIC_CLOUDINARY_API_KEY?: string;
    readonly PUBLIC_GTM_ID?: string;
    readonly PUBLIC_ONETRUST_DOMAIN_SCRIPT?: string;
    readonly PUBLIC_HUBSPOT_PORTAL_ID?: string;
    readonly NUXT_PUBLIC_STORYBLOK_ACCESS_TOKEN?: string;
    readonly NUXT_PUBLIC_STORYBLOK_DEV_AUTO_SYNC?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
