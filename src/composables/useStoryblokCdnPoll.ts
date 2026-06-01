import { publicSiteConfig } from "~/lib/site-config";
import {
    fetchStoryblokStory,
    fetchStoryblokStoryCv,
    isNetlifyBranchPreviewHost,
    serializeStoryContent,
    shouldPollStoryblokCdn,
} from "~/utils/storyblok-cdn";

type StoryblokPollStory = {
    id: string | number;
    content: string | Record<string, unknown>;
};

export const useStoryblokCdnPoll = (
    slug: Ref<string> | string,
    story: Ref<StoryblokPollStory>,
    onStoryUpdate: (story: StoryblokPollStory) => void
) => {
    const contentFingerprintRef = ref(serializeStoryContent(story.value.content));
    let stopPoll: (() => void) | undefined;

    watch(
        () => story.value.content,
        (content) => {
            contentFingerprintRef.value = serializeStoryContent(content);
        }
    );

    const startPoll = (resolvedSlug: string) => {
        stopPoll?.();

        if (!shouldPollStoryblokCdn()) {
            return;
        }

        let cancelled = false;
        let lastCv: number | null = null;
        const pollIntervalMs = import.meta.env.DEV
            ? Number(publicSiteConfig.storyblokDevPollMs || 1000)
            : isNetlifyBranchPreviewHost()
              ? Number(publicSiteConfig.storyblokLivePreviewPollMs || 2000)
              : Number(publicSiteConfig.storyblokLivePreviewPollMs || 3000);

        const applyStoryFromCdn = async () => {
            const fetched = await fetchStoryblokStory(resolvedSlug, { bustCache: true });

            if (cancelled || !fetched) {
                return;
            }

            const nextStory: StoryblokPollStory = {
                id: fetched.id,
                content: fetched.content,
            };
            const nextFingerprint = serializeStoryContent(nextStory.content);

            if (nextFingerprint !== contentFingerprintRef.value) {
                contentFingerprintRef.value = nextFingerprint;
                onStoryUpdate(nextStory);
            }
        };

        const syncIfStoryChanged = async (force = false) => {
            if (document.hidden) {
                return;
            }

            const currentCv = await fetchStoryblokStoryCv(resolvedSlug, { bustCache: true });

            if (currentCv === null) {
                if (force) {
                    await applyStoryFromCdn();
                }

                return;
            }

            if (lastCv === null || force) {
                lastCv = currentCv;
                await applyStoryFromCdn();
                return;
            }

            if (currentCv === lastCv) {
                return;
            }

            lastCv = currentCv;
            await applyStoryFromCdn();
        };

        void syncIfStoryChanged(true);

        const intervalId = window.setInterval(() => {
            void syncIfStoryChanged();
        }, pollIntervalMs);

        const handleVisibilityChange = () => {
            if (!document.hidden) {
                void syncIfStoryChanged(true);
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);

        stopPoll = () => {
            cancelled = true;
            window.clearInterval(intervalId);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    };

    onMounted(() => {
        startPoll(typeof slug === "string" ? slug : slug.value);
    });

    if (typeof slug !== "string") {
        watch(slug, (nextSlug) => {
            startPoll(nextSlug);
        });
    }

    onUnmounted(() => {
        stopPoll?.();
    });
};
