import { createFileRoute } from "@tanstack/react-router";

import { StreetSmartPage } from "@/features/street-smart/StreetSmartPage";

export const Route = createFileRoute("/street-smart")({
  head: () => ({
    meta: [
      { title: "Walks & Workshops — noticing the city together" },
      {
        name: "description",
        content:
          "Walks & Workshops are shared spaces for noticing the city together: upcoming walks you can join and posters from past sessions.",
      },
      { property: "og:title", content: "Walks & Workshops — noticing the city together" },
      {
        property: "og:description",
        content:
          "Past walk posters, the virtual edition, and upcoming walks you can join in Bengaluru, Mumbai and Kochi.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StreetSmartPage,
});
