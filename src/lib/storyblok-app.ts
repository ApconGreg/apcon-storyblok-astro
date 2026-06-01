import type { App } from "vue";
import { setupStoryblokVue } from "./storyblok-setup";

export default (app: App) => {
    setupStoryblokVue(app);
};
