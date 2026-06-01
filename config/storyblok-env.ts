export const getStoryblokAccessToken = () =>
    import.meta.env.PUBLIC_STORYBLOK_ACCESS_TOKEN ||
    import.meta.env.NUXT_PUBLIC_STORYBLOK_ACCESS_TOKEN ||
    import.meta.env.GATSBY_STORYBLOK_ACCESS_TOKEN ||
    import.meta.env.SB_TOKEN ||
    "";

export const getStoryblokVersion = () =>
    import.meta.env.PUBLIC_STORYBLOK_VERSION ||
    import.meta.env.NUXT_PUBLIC_STORYBLOK_VERSION ||
    import.meta.env.GATSBY_STORYBLOK_VERSION ||
    import.meta.env.SB_VERSION ||
    "draft";

export const getStoryblokRegion = () =>
    (
        import.meta.env.PUBLIC_STORYBLOK_REGION ||
        import.meta.env.NUXT_PUBLIC_STORYBLOK_REGION ||
        import.meta.env.GATSBY_STORYBLOK_REGION ||
        import.meta.env.SB_REGION ||
        ""
    ).toLowerCase();

export const isStoryblokLivePreviewEnabled = () =>
    import.meta.env.PUBLIC_STORYBLOK_LIVE_PREVIEW === "true" ||
    import.meta.env.NUXT_PUBLIC_STORYBLOK_LIVE_PREVIEW === "true";
