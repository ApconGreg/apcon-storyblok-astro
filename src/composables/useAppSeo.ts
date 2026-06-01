import { publicSiteConfig } from "~/lib/site-config";

type AppSeoOptions = {
    title?: MaybeRefOrGetter<string | undefined>;
    description?: MaybeRefOrGetter<string | undefined>;
    pathname?: MaybeRefOrGetter<string | undefined>;
};

export const useAppSeo = (options: AppSeoOptions = {}) => {
    const updateMeta = () => {
        const title = toValue(options.title);
        const siteTitle = publicSiteConfig.siteTitle;
        document.title = title ? `${title} | ${siteTitle}` : siteTitle;

        const description = toValue(options.description) || publicSiteConfig.siteDescription;
        let descriptionMeta = document.querySelector('meta[name="description"]');

        if (!descriptionMeta) {
            descriptionMeta = document.createElement("meta");
            descriptionMeta.setAttribute("name", "description");
            document.head.appendChild(descriptionMeta);
        }

        descriptionMeta.setAttribute("content", description);
    };

    onMounted(updateMeta);

    watch(
        () => [toValue(options.title), toValue(options.description), toValue(options.pathname)],
        updateMeta
    );
};
