<script setup lang="ts">
import { isOneTrustEnabled } from "@config/integrations";
import { useSiteConfig } from "~/composables/useSiteConfig";

const config = useSiteConfig();
</script>

<template>
    <div class="min-h-screen flex flex-col">
        <header class="navbar bg-base-200 px-4 lg:px-8">
            <div class="flex-1">
                <a href="/" class="btn btn-ghost text-xl">
                    {{ config.public.siteTitle }}
                </a>
            </div>
            <div class="flex-none gap-2">
                <button
                    v-if="isOneTrustEnabled()"
                    type="button"
                    id="ot-sdk-btn"
                    class="ot-sdk-show-settings btn btn-ghost btn-sm"
                >
                    Cookie Settings
                </button>
            </div>
        </header>

        <main class="flex-1 bg-[#1d293e]">
            <slot />
        </main>

        <footer class="footer footer-center bg-base-200 p-8 text-base-content">
            <aside>
                <p>&copy; {{ new Date().getFullYear() }} {{ config.public.siteTitle }}. All rights reserved.</p>
            </aside>
        </footer>
    </div>
</template>
