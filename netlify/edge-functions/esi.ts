import type { Config, Context } from "https://edge.netlify.com";
import { HTMLRewriter } from "https://ghuc.cc/worker-tools/html-rewriter/index.ts";

export default async (request: Request, context: Context) => {
  const url = new URL(request.url);
  if (url.pathname.match(/\..+$/)) {
    return;
  }
  const response = await context.next(request);
  return new HTMLRewriter().on("*", {
    async element(element) {
      if (element.tagName !== "esi:include") {
        return;
      }
      const src = element.getAttribute("src");
      if (src) {
        const url = src.match(/^https?:/) ? src : new URL(src, request.url);
        const resp = await fetch(url.toString());
        const text = await resp.text();
        element.replace(text, { html: true });
      }
    },
  }).transform(response);
};

export const config: Config = {
  path: "/*",
  excludedPath: "/includes/*",
  cache: "manual",
};
