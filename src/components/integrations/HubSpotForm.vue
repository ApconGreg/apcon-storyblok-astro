<script setup lang="ts">
import { isHubSpotEnabled } from "@config/integrations";

type HubSpotWindow = Window & {
    hbspt?: {
        forms: {
            create: (options: Record<string, string>) => void;
        };
    };
};

const props = withDefaults(
    defineProps<{
        formId: string;
        portalId?: string;
        region?: string;
        className?: string;
    }>(),
    {
        region: "na1",
        className: "",
    }
);

import { useSiteConfig } from "~/composables/useSiteConfig";

const config = useSiteConfig();
const containerId = computed(() => `hubspot-form-${props.formId}`);
const resolvedPortalId = computed(() => props.portalId || config.public.hubspotPortalId);
const enabled = computed(() => isHubSpotEnabled());
const isLoading = ref(true);

const loadHubSpotScript = () =>
    new Promise<void>((resolve, reject) => {
        const hubspotWindow = window as HubSpotWindow;

        if (hubspotWindow.hbspt) {
            resolve();
            return;
        }

        const existingScript = document.getElementById("hubspot-forms-script");

        if (existingScript) {
            existingScript.addEventListener("load", () => resolve(), { once: true });
            existingScript.addEventListener("error", () => reject(new Error("HubSpot script failed to load")), {
                once: true,
            });
            return;
        }

        const script = document.createElement("script");
        script.id = "hubspot-forms-script";
        script.src = "https://js.hsforms.net/forms/embed/v2.js";
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("HubSpot script failed to load"));
        document.head.appendChild(script);
    });

onMounted(async () => {
    if (!enabled.value || !resolvedPortalId.value) {
        isLoading.value = false;
        return;
    }

    try {
        await loadHubSpotScript();
        const hubspotWindow = window as HubSpotWindow;

        hubspotWindow.hbspt?.forms.create({
            region: props.region,
            portalId: resolvedPortalId.value,
            formId: props.formId,
            target: `#${containerId.value}`,
        });
    } finally {
        isLoading.value = false;
    }
});
</script>

<template>
    <div v-if="!enabled" />
    <p v-else-if="!resolvedPortalId" class="text-sm text-base-content/70">
        Set NUXT_PUBLIC_HUBSPOT_PORTAL_ID to render HubSpot forms.
    </p>
    <div v-else :class="className">
        <span v-if="isLoading" class="loading loading-spinner loading-md" />
        <div :id="containerId" />
    </div>
</template>
