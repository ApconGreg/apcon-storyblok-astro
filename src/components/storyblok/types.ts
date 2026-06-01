export type StoryblokBlok = {
    _uid: string;
    component: string;
    [key: string]: unknown;
};

export type StoryblokLink = {
    url?: string;
    cached_url?: string;
    linktype?: string;
    target?: string;
    id?: string;
};

export type StoryblokAsset = {
    filename?: string;
    alt?: string;
    title?: string;
    name?: string;
};

export type StoryblokRichtext = {
    type?: string;
    content?: unknown[];
    [key: string]: unknown;
};

export type StoryblokComponentProps<T extends StoryblokBlok = StoryblokBlok> = {
    blok: T;
};

export type StoryblokPreviewStory = {
    id: string | number;
    name?: string;
    content: string | Record<string, unknown>;
};
