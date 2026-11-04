import { createFileRoute } from "@tanstack/react-router";

import { ArchivePage } from "@/features/archive/ArchivePage";

export const Route = createFileRoute("/archive")({
  head: () => ({
    meta: [
      { title: "The Archive — stories from streets everywhere" },
      {
        name: "description",
        content:
          "Sticky notes from people who walk streets you never will. Filter by theme, read a random note, and add your own story, voice note or photo.",
      },
      { property: "og:title", content: "The Archive — stories from streets everywhere" },
      {
        property: "og:description",
        content:
          "Filter, read and add real safety stories, voice notes and photos to the Street Smart archive.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ArchivePage,
});
