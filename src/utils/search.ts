import Fuse from "fuse.js";

export type SearchItem = {
    title: string;
    slug: string;
    excerpt?: string;
};

export const createSearchIndex = (items: SearchItem[]) =>
    new Fuse(items, {
        keys: ["title", "excerpt", "slug"],
        threshold: 0.35,
        ignoreLocation: true,
    });

export const searchItems = (index: Fuse<SearchItem>, query: string) =>
    index.search(query).map((result) => result.item);
