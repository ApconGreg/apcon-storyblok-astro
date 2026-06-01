<script setup lang="ts">
import MarkdownIt from "markdown-it";
import { renderRichText, StoryblokComponent } from "@storyblok/vue";
import { HERO_PARALLAX_CONFIG, useHeroParallax } from "~/composables/useHeroParallax";
import { scrollToMain } from "~/utils/scrollToMain";
import type { StoryblokAsset, StoryblokBlok, StoryblokComponentProps, StoryblokLink, StoryblokRichtext } from "./types";
import {
    getNestedBloks,
    resolveBgColorClass,
    resolveBgColorStyle,
    resolveBlokClasses,
    resolveMediaBlendStyle,
    resolveSectionBackgroundStyle,
    resolveStoryblokOptionValue,
    type StoryblokColorPluginValue,
    type StoryblokDomFields,
} from "./utils";

type HeroBlok = StoryblokBlok &
    StoryblokDomFields & {
        image?: StoryblokAsset;
        video?: StoryblokAsset;
        video_url?: string | StoryblokLink;
        img_vid_toggle?: boolean | string;
        height?: string | { value?: string };
        scroll_to?: boolean | string;
        eyebrow?: string;
        headline?: string;
        subheading?: string | StoryblokRichtext;
        summary?: string | StoryblokRichtext;
        cta_row?: StoryblokBlok[];
        position?: string | { value?: string };
        align?: string | { value?: string };
        img_move?: string | { value?: string };
        bg_color?: StoryblokColorPluginValue;
        bg_blend?: string | { value?: string };
    };

const props = defineProps<StoryblokComponentProps<HeroBlok>>();
const markdown = new MarkdownIt();
const HTML_TAG_PATTERN = /<\/?[a-z][\s\S]*>/i;

const nativeVideoRef = ref<HTMLVideoElement | null>(null);
const youtubeIframeRef = ref<HTMLIFrameElement | null>(null);
const embedVideoRef = ref<HTMLDivElement | null>(null);
const imageRef = ref<HTMLDivElement | null>(null);
const youtubeReadyRef = ref(false);
const userPausedRef = ref(false);
const isVideoPlaying = ref(true);
const youtubeEmbedUrl = ref<string | undefined>();

const isRichtext = (value: unknown): value is StoryblokRichtext =>
    Boolean(value && typeof value === "object" && !Array.isArray(value) && "type" in value && value.type === "doc");

const isTruthy = (value?: boolean | string) => value === true || value === "true";

const getVideoMimeType = (src?: string) => {
    if (!src) return undefined;
    const path = src.split("?")[0];
    if (path.endsWith(".webm")) return "video/webm";
    if (path.endsWith(".ogg")) return "video/ogg";
    if (path.endsWith(".mp4")) return "video/mp4";
    return undefined;
};

const resolveHeroVideoUrl = (value?: string | StoryblokLink): string | undefined => {
    if (!value) return undefined;
    if (typeof value === "string") {
        const url = value.trim();
        return url || undefined;
    }
    const url = value.url?.trim() || value.cached_url?.trim();
    return url || undefined;
};

const parseYoutubeVideoId = (url: string): string | undefined => {
    try {
        const parsed = new URL(url);
        const host = parsed.hostname.replace(/^www\./, "");
        if (host === "youtu.be") return parsed.pathname.slice(1).split("/")[0] || undefined;
        if (host === "youtube.com" || host === "m.youtube.com") {
            if (parsed.pathname.startsWith("/embed/")) return parsed.pathname.split("/")[2] || undefined;
            if (parsed.pathname.startsWith("/shorts/")) return parsed.pathname.split("/")[2] || undefined;
            return parsed.searchParams.get("v") || undefined;
        }
    } catch {
        return undefined;
    }
    return undefined;
};

const getYoutubeEmbedUrl = (url: string, origin?: string): string | undefined => {
    const videoId = parseYoutubeVideoId(url);
    if (!videoId) return undefined;
    const params = new URLSearchParams({
        autoplay: "1",
        mute: "1",
        loop: "1",
        playlist: videoId,
        controls: "0",
        rel: "0",
        modestbranding: "1",
        playsinline: "1",
        iv_load_policy: "3",
        enablejsapi: "1",
        cc_load_policy: "0",
        disablekb: "1",
        fs: "0",
    });
    if (origin) params.set("origin", origin);
    return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
};

const resolveHeroVideoSource = (blok: HeroBlok): string | undefined => {
    if (blok.video?.filename) return blok.video.filename;
    return resolveHeroVideoUrl(blok.video_url);
};

type YoutubePlayerCommand = "playVideo" | "pauseVideo";

const sendYoutubeCommand = (iframe: HTMLIFrameElement, command: YoutubePlayerCommand) => {
    iframe.contentWindow?.postMessage(
        JSON.stringify({ event: "command", func: command, args: "" }),
        "https://www.youtube.com"
    );
};

const renderMarkdownContent = (content: string) => {
    if (HTML_TAG_PATTERN.test(content)) {
        return content;
    }
    return markdown.render(content);
};

const renderMarkdownField = (content?: string | StoryblokRichtext) => {
    if (!content) return null;
    if (typeof content === "string") {
        if (!content.trim()) return null;
        return renderMarkdownContent(content);
    }
    if (isRichtext(content)) {
        try {
            return renderRichText(content) || null;
        } catch {
            return null;
        }
    }
    return null;
};

const ctaButtons = computed(() => getNestedBloks(props.blok as Record<string, unknown>, ["cta_row"]));
const heightClass = computed(() => resolveStoryblokOptionValue(props.blok.height));
const positionClass = computed(() => resolveStoryblokOptionValue(props.blok.position));
const alignClass = computed(() => resolveStoryblokOptionValue(props.blok.align));
const imgMoveClass = computed(() => resolveStoryblokOptionValue(props.blok.img_move));
const isParallax = computed(() => imgMoveClass.value === "img-parallax");
const hideVideo = computed(() => isTruthy(props.blok.img_vid_toggle));
const videoSrc = computed(() => resolveHeroVideoSource(props.blok));
const isYoutubeVideo = computed(() => Boolean(videoSrc.value && parseYoutubeVideoId(videoSrc.value)));
const showVideo = computed(() => !hideVideo.value && Boolean(videoSrc.value));
const showScrollButton = computed(() => isTruthy(props.blok.scroll_to));
const bgColorClass = computed(() => resolveBgColorClass(props.blok.bg_color));
const bgColorStyle = computed(() => resolveBgColorStyle(props.blok.bg_color));
const heroSectionStyle = computed(() =>
    isParallax.value ? undefined : resolveSectionBackgroundStyle(props.blok.image, props.blok.bg_blend, props.blok.bg_color)
);
const heroImageStyle = computed(() =>
    isParallax.value && props.blok.image?.filename
        ? {
              backgroundImage: `url(${props.blok.image.filename})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              ...resolveMediaBlendStyle(props.blok.image, props.blok.bg_blend),
          }
        : undefined
);
const videoBlendStyle = computed(() =>
    resolveMediaBlendStyle(videoSrc.value ? { filename: videoSrc.value } : undefined, props.blok.bg_blend)
);
const videoMimeType = computed(() => getVideoMimeType(videoSrc.value));
const subheadingContent = computed(() => renderMarkdownField(props.blok.subheading));
const summaryContent = computed(() => renderMarkdownField(props.blok.summary));

useHeroParallax(
    { imageRef, nativeVideoRef, embedVideoRef, isYoutubeVideo },
    isParallax,
    HERO_PARALLAX_CONFIG
);

watch([videoSrc, isYoutubeVideo], () => {
    userPausedRef.value = false;
    youtubeReadyRef.value = false;

    if (!videoSrc.value || !isYoutubeVideo.value) {
        youtubeEmbedUrl.value = undefined;
        return;
    }

    youtubeEmbedUrl.value = getYoutubeEmbedUrl(videoSrc.value, window.location.origin);
}, { immediate: true });

watch(
    () => showVideo.value && !isYoutubeVideo.value,
    (active) => {
        if (!active) {
            return;
        }

        const video = nativeVideoRef.value;

        if (!video) {
            return;
        }

        const handlePlay = () => {
            isVideoPlaying.value = true;
        };
        const handlePause = () => {
            isVideoPlaying.value = false;
        };

        video.addEventListener("play", handlePlay);
        video.addEventListener("pause", handlePause);
        isVideoPlaying.value = !video.paused;

        return () => {
            video.removeEventListener("play", handlePlay);
            video.removeEventListener("pause", handlePause);
        };
    },
    { flush: "post" }
);

watch(
    () => showVideo.value && isYoutubeVideo.value,
    (active) => {
        if (!active) {
            return;
        }

        const handleMessage = (event: MessageEvent) => {
            if (event.origin !== "https://www.youtube.com") {
                return;
            }

            let data: { event?: string; info?: number };

            try {
                data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
            } catch {
                return;
            }

            if (data.event === "onReady") {
                youtubeReadyRef.value = true;

                if (!userPausedRef.value) {
                    isVideoPlaying.value = true;
                }

                return;
            }

            if (data.event === "onStateChange" && typeof data.info === "number") {
                if (userPausedRef.value) {
                    if (data.info === 2) {
                        isVideoPlaying.value = false;
                    }

                    return;
                }

                isVideoPlaying.value = data.info === 1 || data.info === 3;

                if (data.info === 2) {
                    userPausedRef.value = true;
                }
            }
        };

        window.addEventListener("message", handleMessage);

        return () => {
            window.removeEventListener("message", handleMessage);
        };
    }
);

watch(
    () => showVideo.value && isYoutubeVideo.value,
    (active) => {
        if (!active) {
            return;
        }

        const mq = window.matchMedia("(prefers-reduced-motion: reduce)");

        const syncPlayback = () => {
            const iframe = youtubeIframeRef.value;

            if (!iframe || !mq.matches) {
                return;
            }

            sendYoutubeCommand(iframe, "pauseVideo");
            userPausedRef.value = true;
            isVideoPlaying.value = false;
        };

        syncPlayback();
        mq.addEventListener("change", syncPlayback);

        return () => {
            mq.removeEventListener("change", syncPlayback);
        };
    }
);

watch(
    () => showVideo.value && !isYoutubeVideo.value,
    (active) => {
        if (!active) {
            return;
        }

        const mq = window.matchMedia("(prefers-reduced-motion: reduce)");

        const syncPlayback = () => {
            const video = nativeVideoRef.value;

            if (!video) {
                return;
            }

            if (mq.matches) {
                video.pause();
                userPausedRef.value = true;
                isVideoPlaying.value = false;

                try {
                    video.currentTime = 0;
                } catch {
                    // Ignore if not seekable yet.
                }

                return;
            }

            if (userPausedRef.value) {
                return;
            }

            video
                .play()
                .then(() => {
                    isVideoPlaying.value = true;
                })
                .catch(() => {
                    isVideoPlaying.value = false;
                });
        };

        syncPlayback();
        mq.addEventListener("change", syncPlayback);

        return () => {
            mq.removeEventListener("change", syncPlayback);
        };
    },
    { flush: "post" }
);

const toggleVideoPlayback = () => {
    if (isYoutubeVideo.value) {
        const iframe = youtubeIframeRef.value;
        if (!iframe || !youtubeReadyRef.value) return;
        if (isVideoPlaying.value) {
            sendYoutubeCommand(iframe, "pauseVideo");
            userPausedRef.value = true;
            isVideoPlaying.value = false;
        } else {
            sendYoutubeCommand(iframe, "playVideo");
            userPausedRef.value = false;
            isVideoPlaying.value = true;
        }
        return;
    }

    const video = nativeVideoRef.value;
    if (!video) return;
    if (video.paused) {
        userPausedRef.value = false;
        video.play().then(() => (isVideoPlaying.value = true)).catch(() => {});
    } else {
        userPausedRef.value = true;
        video.pause();
        isVideoPlaying.value = false;
    }
};

const handleYoutubeIframeLoad = () => {
    youtubeReadyRef.value = true;
};
</script>

<template>
    <section
        v-editable="blok"
        :id="blok.id"
        :style="heroSectionStyle"
        :class="['hero', heightClass, imgMoveClass, resolveBlokClasses(blok), !isParallax ? bgColorClass : undefined].filter(Boolean).join(' ')"
        :aria-labelledby="blok.headline ? 'hero-title' : undefined"
    >
        <div
            v-if="isParallax && (bgColorStyle.backgroundColor || bgColorClass)"
            :class="['hero-bg-color', bgColorClass].filter(Boolean).join(' ')"
            :style="bgColorStyle"
            aria-hidden="true"
        />

        <div
            v-if="isParallax && blok.image?.filename"
            ref="imageRef"
            class="hero-bg-image"
            :style="heroImageStyle"
            aria-hidden="true"
        />

        <div
            v-if="showVideo && isYoutubeVideo && youtubeEmbedUrl"
            ref="embedVideoRef"
            :class="['hero-bg-video hero-bg-video--embed', !isVideoPlaying ? 'is-paused' : undefined].filter(Boolean).join(' ')"
            :style="videoBlendStyle"
            aria-hidden="true"
        >
            <iframe
                ref="youtubeIframeRef"
                class="hero-bg-video__iframe"
                :src="youtubeEmbedUrl"
                title="Hero background video"
                allow="autoplay; encrypted-media; picture-in-picture"
                tabindex="-1"
                @load="handleYoutubeIframeLoad"
            />
            <div v-if="!isVideoPlaying" class="hero-bg-video__pause-overlay" aria-hidden="true" />
        </div>

        <video
            v-if="showVideo && !isYoutubeVideo && videoSrc"
            ref="nativeVideoRef"
            class="hero-bg-video"
            :style="videoBlendStyle"
            muted
            loop
            playsinline
            :poster="blok.image?.filename"
        >
            <source :src="videoSrc" v-bind="videoMimeType ? { type: videoMimeType } : {}" />
            Your browser does not support the video tag.
        </video>

        <div :class="['hero-content', positionClass, alignClass].filter(Boolean).join(' ')">
            <div v-if="blok.eyebrow" class="eyebrow">{{ blok.eyebrow }}</div>
            <h1 v-if="blok.headline" id="hero-title" class="hero-heading">{{ blok.headline }}</h1>
            <div v-if="subheadingContent" class="subheading" v-html="subheadingContent" />
            <div v-if="summaryContent" class="summary" v-html="summaryContent" />
            <div v-if="ctaButtons.length > 0" class="cta-row">
                <StoryblokComponent v-for="nestedBlok in ctaButtons" :key="nestedBlok._uid" :blok="nestedBlok" />
            </div>
        </div>

        <button
            v-if="showVideo"
            type="button"
            class="hero-video-btn"
            :aria-label="isVideoPlaying ? 'Pause video' : 'Play video'"
            :aria-pressed="isVideoPlaying"
            @click="toggleVideoPlayback"
        >
            <svg v-if="isVideoPlaying" class="hero-video-btn__icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <rect x="6" y="5" width="4" height="14" />
                <rect x="14" y="5" width="4" height="14" />
            </svg>
            <svg v-else class="hero-video-btn__icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <polygon points="8 5 19 12 8 19" />
            </svg>
        </button>

        <button v-if="showScrollButton" type="button" class="scroll-btn" aria-label="Scroll to main content" @click="scrollToMain">
            <svg class="scroll-btn__arrow" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <polyline points="6 9 12 15 18 9" />
            </svg>
        </button>
    </section>
</template>
