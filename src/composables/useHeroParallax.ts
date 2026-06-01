import type { Ref } from "vue";

export type HeroParallaxConfig = {
    speed: number;
    maxOffset: number;
    scale: number;
};

export const HERO_PARALLAX_CONFIG: HeroParallaxConfig = {
    speed: 0.35,
    maxOffset: 120,
    scale: 1.15,
};

type HeroParallaxRefs = {
    imageRef: Ref<HTMLElement | null>;
    nativeVideoRef: Ref<HTMLElement | null>;
    embedVideoRef: Ref<HTMLElement | null>;
    isYoutubeVideo: Ref<boolean>;
};

export const useHeroParallax = (
    refs: HeroParallaxRefs,
    enabled: Ref<boolean>,
    config: HeroParallaxConfig = HERO_PARALLAX_CONFIG
) => {
    let frame = 0;
    let scheduleUpdate = () => {};
    let reducedMotionQuery: MediaQueryList | null = null;

    const cleanupElements = (elements: HTMLElement[]) => {
        elements.forEach((element) => {
            element.style.transform = "";
        });
    };

    const bindParallax = () => {
        cancelAnimationFrame(frame);
        window.removeEventListener("scroll", scheduleUpdate);
        window.removeEventListener("resize", scheduleUpdate);
        reducedMotionQuery?.removeEventListener("change", bindParallax);

        if (!enabled.value || typeof window === "undefined") {
            return;
        }

        const elements = [
            refs.imageRef.value,
            refs.isYoutubeVideo.value ? refs.embedVideoRef.value : refs.nativeVideoRef.value,
        ].filter((element): element is HTMLElement => element instanceof HTMLElement);

        if (!elements.length) {
            return;
        }

        reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

        if (reducedMotionQuery.matches) {
            return;
        }

        const hero = elements[0].closest(".hero");

        if (!hero) {
            return;
        }

        const update = () => {
            const rect = hero.getBoundingClientRect();
            const scrollProgress = -rect.top / (rect.height + window.innerHeight);
            const rawOffset = scrollProgress * window.innerHeight * config.speed;
            const offset = Math.min(Math.max(rawOffset, -config.maxOffset), config.maxOffset);
            const transform = `translate3d(0, ${offset}px, 0) scale(${config.scale})`;

            elements.forEach((element) => {
                element.style.transform = transform;
            });
        };

        scheduleUpdate = () => {
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(update);
        };

        update();
        window.addEventListener("scroll", scheduleUpdate, { passive: true });
        window.addEventListener("resize", scheduleUpdate, { passive: true });
        reducedMotionQuery.addEventListener("change", bindParallax);
    };

    watch([enabled, () => refs.isYoutubeVideo.value, () => refs.imageRef.value, () => refs.nativeVideoRef.value, () => refs.embedVideoRef.value], bindParallax, {
        flush: "post",
    });

    onMounted(bindParallax);

    onUnmounted(() => {
        cancelAnimationFrame(frame);
        window.removeEventListener("scroll", scheduleUpdate);
        window.removeEventListener("resize", scheduleUpdate);
        reducedMotionQuery?.removeEventListener("change", bindParallax);

        const elements = [
            refs.imageRef.value,
            refs.isYoutubeVideo.value ? refs.embedVideoRef.value : refs.nativeVideoRef.value,
        ].filter((element): element is HTMLElement => element instanceof HTMLElement);

        cleanupElements(elements);
    });
};
