import { createFileRoute } from "@tanstack/react-router";

import { WhatWeveLearnedPage } from "@/features/what-weve-learned/WhatWeveLearnedPage";

export const Route = createFileRoute("/what-weve-learned/")({
  head: () => ({
    meta: [
      { title: "What we've learned — Text When You Get Home" },
      {
        name: "description",
        content:
          "Things we keep on hearing, research essays, and field notes on urban safety, care networks, and night walks from Text When You Get Home.",
      },
      { property: "og:title", content: "What we've learned — Text When You Get Home" },
      {
        property: "og:description",
        content:
          "Things we keep on hearing, research essays, and field notes on urban safety, care networks, and night walks from Text When You Get Home.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WhatWeveLearnedPage,
});
