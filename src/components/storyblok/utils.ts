import type { CSSProperties } from "vue";
import type { StoryblokAsset, StoryblokBlok, StoryblokLink } from "./types";

export type StoryblokColorPluginValue = string | { color?: string; value?: string };

/** Storyblok Iconify / icon plugin field. */
export type StoryblokIconPluginValue =
    | string
    | {
          _uid?: string;
          icon?: string;
          plugin?: string;
      };

export const resolveStoryblokIcon = (value?: StoryblokIconPluginValue): string | undefined => {
    if (!value) {
        return undefined;
    }

    if (typeof value === "string") {
        const trimmed = value.trim();

        return trimmed || undefined;
    }

    if (typeof value.icon === "string") {
        const trimmed = value.icon.trim();

        return trimmed || undefined;
    }

    return undefined;
};

export type StoryblokDomFields = {
    id?: string;
    classes?: string;
    class?: string;
};

export const resolveBlokClasses = (blok?: StoryblokDomFields) => blok?.classes || blok?.class || undefined;

export const resolveBgColorStyle = (value?: StoryblokColorPluginValue): CSSProperties => {
    if (!value) {
        return {};
    }

    if (typeof value === "string") {
        if (value.startsWith("#") || value.startsWith("rgb")) {
            return { backgroundColor: value };
        }

        return {};
    }

    const color = value.color || value.value;

    return color ? { backgroundColor: color } : {};
};

export const resolveBgColorClass = (value?: StoryblokColorPluginValue) => {
    if (typeof value === "string" && !value.startsWith("#") && !value.startsWith("rgb")) {
        return value;
    }

    return undefined;
};

const BACKGROUND_BLEND_MODES = new Set<NonNullable<CSSProperties["backgroundBlendMode"]>>([
    "normal",
    "multiply",
    "screen",
    "overlay",
    "darken",
    "lighten",
    "color-dodge",
    "color-burn",
    "hard-light",
    "soft-light",
    "difference",
    "exclusion",
    "hue",
    "saturation",
    "color",
    "luminosity",
]);

export const resolveStoryblokOptionValue = (value?: string | { value?: string }) => {
    if (!value) {
        return undefined;
    }

    if (typeof value === "string") {
        return value.trim() || undefined;
    }

    if (typeof value.value === "string") {
        return value.value.trim() || undefined;
    }

    return undefined;
};

export const resolveBgBlendMode = (
    blend?: string | { value?: string }
): CSSProperties["backgroundBlendMode"] | undefined => {
    const raw = resolveStoryblokOptionValue(blend);

    if (!raw) {
        return undefined;
    }

    const normalized = raw.replace(/^bg-blend-/, "");

    return BACKGROUND_BLEND_MODES.has(normalized as NonNullable<CSSProperties["backgroundBlendMode"]>)
        ? (normalized as CSSProperties["backgroundBlendMode"])
        : undefined;
};

export const resolveBackgroundPosition = (position?: string) => {
    const value = position || "object-center";

    const mapping: Record<string, string> = {
        "object-center": "center",
        "object-top": "top",
        "object-bottom": "bottom",
        "object-left": "left",
        "object-right": "right",
        "object-left-top": "left top",
        "object-left-bottom": "left bottom",
        "object-right-top": "right top",
        "object-right-bottom": "right bottom",
    };

    return mapping[value] || "center";
};

export const resolveSectionBackgroundStyle = (
    image?: StoryblokAsset,
    blend?: string | { value?: string },
    bgColor?: StoryblokColorPluginValue,
    position?: string
): CSSProperties => {
    const bgColorStyle = resolveBgColorStyle(bgColor);

    if (!image?.filename) {
        return bgColorStyle;
    }

    const style: CSSProperties = {
        ...bgColorStyle,
        backgroundImage: `url(${image.filename})`,
        backgroundSize: "cover",
        backgroundPosition: resolveBackgroundPosition(position),
        backgroundRepeat: "no-repeat",
    };

    const blendMode = resolveBgBlendMode(blend);

    if (blendMode) {
        style.backgroundBlendMode = blendMode;
    }

    return style;
};

export const resolveMediaBlendStyle = (
    media?: { filename?: string },
    blend?: string | { value?: string }
): CSSProperties => {
    if (!media?.filename) {
        return {};
    }

    const blendMode = resolveBgBlendMode(blend);

    return blendMode ? { mixBlendMode: blendMode as CSSProperties["mixBlendMode"] } : {};
};

export const getNestedBloks = (blok: Record<string, unknown>, fieldNames: string[]): StoryblokBlok[] => {
    for (const fieldName of fieldNames) {
        const value = blok[fieldName];

        if (Array.isArray(value) && value.length > 0) {
            return value as StoryblokBlok[];
        }
    }

    return [];
};

export const resolveStoryblokLink = (link?: StoryblokLink | string) => {
    if (!link) {
        return "#";
    }

    if (typeof link === "string") {
        return link;
    }

    if (link.linktype === "story" && link.cached_url) {
        const slug = link.cached_url.replace(/\/$/, "");
        return slug === "home" ? "/" : `/${slug}/`;
    }

    if (link.linktype === "email" && link.url) {
        return link.url.startsWith("mailto:") ? link.url : `mailto:${link.url}`;
    }

    return link.url || link.cached_url || "#";
};

const BUTTON_TYPE_CLASSES: Record<string, string> = {
    "btn btn-primary": "btn btn-primary",
    "btn btn-secondary": "btn btn-secondary",
    "btn btn-ghost": "btn btn-ghost",
    "btn btn-outline": "btn btn-outline",
    "btn btn-ouline": "btn btn-outline",
    "btn-primary": "btn btn-primary",
    "btn-secondary": "btn btn-secondary",
    "btn-ghost": "btn btn-ghost",
    "btn-outline": "btn btn-outline",
};

export const getButtonClasses = (type?: string, size?: string) => {
    const normalizedType = type?.trim() || "btn btn-primary";
    const baseClasses = BUTTON_TYPE_CLASSES[normalizedType] || "btn btn-primary";

    const sizeClass =
        {
            sm: "btn-sm",
            md: "",
            lg: "btn-lg",
            xs: "btn-xs",
            "btn-sm": "btn-sm",
            "btn-lg": "btn-lg",
            "btn-xs": "btn-xs",
        }[size?.trim() || "md"] || "";

    return [baseClasses, sizeClass].filter(Boolean).join(" ");
};

export const getGridColumnsClass = (columns?: string | number) => {
    const count = Number(columns) || 3;

    return (
        {
            1: "grid-cols-1",
            2: "md:grid-cols-2",
            3: "md:grid-cols-2 lg:grid-cols-3",
            4: "md:grid-cols-2 lg:grid-cols-4",
        }[count] || "md:grid-cols-2 lg:grid-cols-3"
    );
};

export const getRestrictClass = (restrict?: string | boolean) => {
    if (restrict === false || restrict === "false") {
        return "w-full";
    }

    return (
        {
            narrow: "max-w-3xl mx-auto",
            default: "contain w-full max-w-7xl mx-auto px-4",
            wide: "max-w-7xl mx-auto px-4",
            full: "w-full",
        }[String(restrict || "default")] || "contain w-full max-w-7xl mx-auto px-4"
    );
};

export const getSpacingClass = (spacing?: string) => {
    return (
        {
            none: "gap-0 py-0",
            sm: "gap-4 py-8",
            md: "gap-6 py-12",
            lg: "gap-8 py-16",
            xl: "gap-10 py-20",
        }[spacing || "md"] || "gap-6 py-12"
    );
};

const BTN_ROW_SPACING_CLASSES = {
    none: "",
    "top-lg": "top-lg",
    "top-md": "top-md",
    "top-sm": "top-sm",
    "top-none": "top-none",
    "bot-none": "bot-none",
    "bot-sm": "bot-sm",
    "bot-md": "bot-md",
    "bot-lg": "bot-lg",
} as const;

export type BtnRowSpacing = keyof typeof BTN_ROW_SPACING_CLASSES;

/** Maps cta-btn-row `btn_row_spacing` Storyblok option to a CSS class (styles in global.css). */
export const getBtnRowSpacingClass = (spacing?: string | { value?: string }) => {
    const value = resolveStoryblokOptionValue(spacing) as BtnRowSpacing | undefined;

    if (!value) {
        return undefined;
    }

    const className = BTN_ROW_SPACING_CLASSES[value];

    return className || undefined;
};
