export type SitePage = {
    slug: string;
    title: string;
    paths?: string[];
};

export const sitePages: SitePage[] = [
    // "/" is served by app/pages/index.vue (Storyblok slug: home).
    // "/home/" remains for Storyblok Visual Editor when the location URL cannot use "/".
    { slug: "home", title: "Home", paths: ["/home/"] },
    { slug: "intellastore", title: "IntellaStore" },
    { slug: "intellastore/intellastore-iv", title: "IntellaStore IV" },
    { slug: "intellastore/threatguard", title: "ThreatGuard" },
    { slug: "intellaview", title: "IntellaView" },
    { slug: "intellaview/intellaview-gui", title: "IntellaView GUI" },
    { slug: "intellaview/chassis", title: "Chassis" },
    { slug: "intellaview/blades", title: "Blades" },
    { slug: "intellaview/taps", title: "TAPs" },
    { slug: "news", title: "News" },
    { slug: "search", title: "Search" },
];

export const getPagePath = (slug: string) => (slug === "home" ? "/" : `/${slug}/`);

export const getPagePaths = (page: SitePage): string[] =>
    page.paths?.length ? page.paths : [getPagePath(page.slug)];

export const getPageBySlug = (slug: string) => sitePages.find((page) => page.slug === slug);

export const getSlugFromPathname = (pathname: string): string | null => {
    const normalizedPath = pathname.replace(/\/$/, "") || "/";

    if (normalizedPath === "/") {
        return "home";
    }

    for (const page of sitePages) {
        for (const pagePath of getPagePaths(page)) {
            const normalizedPagePath = pagePath.replace(/\/$/, "") || "/";

            if (normalizedPath === normalizedPagePath) {
                return page.slug;
            }
        }
    }

    return null;
};
