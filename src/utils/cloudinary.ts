import { publicSiteConfig } from "~/lib/site-config";

type CloudinaryTransformOptions = {
    width?: number;
    height?: number;
    crop?: string;
    quality?: string | number;
    format?: string;
};

export const buildCloudinaryUrl = (publicId: string, options: CloudinaryTransformOptions = {}) => {
    const cloudName = publicSiteConfig.cloudinaryCloudName;

    if (!cloudName) {
        return publicId;
    }

    const transforms = Object.entries(options)
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => `${key}_${value}`)
        .join(",");

    const transformation = transforms ? `${transforms}/` : "";

    return `https://res.cloudinary.com/${cloudName}/image/upload/${transformation}${publicId}`;
};
