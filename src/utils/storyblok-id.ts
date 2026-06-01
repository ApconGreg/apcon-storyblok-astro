export type StoryblokStoryId = string;

export const normalizeStoryId = (id: number | string | undefined | null): StoryblokStoryId | null => {
    if (id === undefined || id === null || id === "") {
        return null;
    }

    return String(id);
};

export const storyIdsMatch = (
    left: number | string | undefined | null,
    right: number | string | undefined | null
) => {
    const normalizedLeft = normalizeStoryId(left);
    const normalizedRight = normalizeStoryId(right);

    return normalizedLeft !== null && normalizedRight !== null && normalizedLeft === normalizedRight;
};

/** Storyblok story ids exceed JS safe integers — extract from raw JSON before parsing. */
export const extractStoryIdFromCdnPayload = (payload: string): StoryblokStoryId | null => {
    const match = payload.match(/"story"\s*:\s*\{[\s\S]*?"id"\s*:\s*(\d+)/);

    return match?.[1] ?? null;
};
