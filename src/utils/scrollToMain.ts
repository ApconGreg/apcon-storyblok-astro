/** Scroll past the hero to the next page section, or fall back to the main landmark. */
export const scrollToMain = () => {
    const hero = document.querySelector(".hero");

    if (hero?.nextElementSibling instanceof HTMLElement) {
        hero.nextElementSibling.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
    }

    document.querySelector("main")?.scrollIntoView({ behavior: "smooth", block: "start" });
};
