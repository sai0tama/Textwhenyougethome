import { createFileRoute } from "@tanstack/react-router";

import { AboutPage } from "@/features/about/AboutPage";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Text When You Get Home" },
      {
        name: "description",
        content:
          "A community built on the idea that a safety text should never have to be sent. Research, stories, and design by Mudito.",
      },
      { property: "og:title", content: "About — Text When You Get Home" },
      {
        property: "og:description",
        content:
          "A community built on the idea that a safety text should never have to be sent. Streets, transit and public spaces were not built with everyone's safety in mind.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AboutPage,
});
