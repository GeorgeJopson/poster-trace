import { test as base } from "@playwright/test";

export { expect } from "@playwright/test";

// `next dev` shows its dev tools badge in the bottom-left corner, on top of
// the bottom of the navigation pane (Account, Sign Out), where it blocks
// clicks. Hide it in every page.
export const test = base.extend({
  context: async ({ context }, use) => {
    await context.addInitScript(() => {
      document.addEventListener("DOMContentLoaded", () => {
        const style = document.createElement("style");
        style.textContent = "nextjs-portal { display: none !important; }";
        document.head.append(style);
      });
    });
    await use(context);
  },
});
