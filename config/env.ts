import dotenv from "dotenv";
import {
    getStoryblokAccessToken,
    getStoryblokRegion,
    getStoryblokVersion,
    isStoryblokLivePreviewEnabled,
} from "./storyblok-env";

dotenv.config();

export const storyblokAccessToken = getStoryblokAccessToken();
export const storyblokVersion = getStoryblokVersion();
export const storyblokRegion = getStoryblokRegion();
export const storyblokLivePreview = isStoryblokLivePreviewEnabled();

export const storyblokSpaceId =
    import.meta.env.PUBLIC_STORYBLOK_SPACE_ID ||
    import.meta.env.NUXT_PUBLIC_STORYBLOK_SPACE_ID ||
    import.meta.env.GATSBY_STORYBLOK_SPACE_ID ||
    import.meta.env.SB_SPACE_ID ||
    "";

export const cloudinaryCloudName =
    import.meta.env.PUBLIC_CLOUDINARY_CLOUD_NAME ||
    import.meta.env.NUXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
    import.meta.env.GATSBY_CLOUDINARY_CLOUD_NAME ||
    import.meta.env.CLOUDINARY_CLOUD_NAME ||
    "";

export const cloudinaryApiKey =
    import.meta.env.PUBLIC_CLOUDINARY_API_KEY ||
    import.meta.env.NUXT_PUBLIC_CLOUDINARY_API_KEY ||
    import.meta.env.GATSBY_CLOUDINARY_API_KEY ||
    import.meta.env.CLOUDINARY_API_KEY ||
    "";
