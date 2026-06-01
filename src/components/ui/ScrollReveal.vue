<script setup lang="ts">
const props = withDefaults(
    defineProps<{
        className?: string;
        threshold?: number;
        triggerOnce?: boolean;
    }>(),
    {
        className: "",
        threshold: 0.15,
        triggerOnce: true,
    }
);

const target = ref<HTMLElement | null>(null);
const inView = ref(false);

onMounted(() => {
    const element = target.value;

    if (!element) {
        return;
    }

    const observer = new IntersectionObserver(
        ([entry]) => {
            if (entry.isIntersecting) {
                inView.value = true;

                if (props.triggerOnce) {
                    observer.disconnect();
                }
            } else if (!props.triggerOnce) {
                inView.value = false;
            }
        },
        { threshold: props.threshold }
    );

    observer.observe(element);

    onUnmounted(() => {
        observer.disconnect();
    });
});
</script>

<template>
    <div
        ref="target"
        :class="[
            'transition-all duration-700',
            inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6',
            className,
        ]"
    >
        <slot />
    </div>
</template>
