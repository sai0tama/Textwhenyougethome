import { createFileRoute } from "@tanstack/react-router";

import { HomePage } from "@/features/home/HomePage";
import { getArchiveStatistics } from "@/server/functions/getArchiveStatistics";

export const Route = createFileRoute("/")({
  loader: async () => {
    try {
      const res = await getArchiveStatistics();
      return { stats: res.status === "success" && res.data ? res.data : null };
    } catch {
      return { stats: null };
    }
  },
  head: () => ({
    meta: [
      { title: "Street Smart — #textwhenyougethome" },
      {
        name: "description",
        content:
          "A community archive of real-world safety habits, walks and stories, built on the belief that a safety text should never have to be sent.",
      },
      { property: "og:title", content: "Street Smart — #textwhenyougethome" },
      {
        property: "og:description",
        content:
          "Real safety habits, walks and stories from streets around the world. Read the archive, add your voice.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      {
        rel: "preload",
        as: "image",
        href: "/assets/home/hero-globe-mobile.webp",
        type: "image/webp",
        media: "(max-width: 767px)",
      },
      {
        rel: "preload",
        as: "image",
        href: "/assets/home/hero-bg.webp",
        type: "image/webp",
        media: "(min-width: 768px)",
      },
    ],
  }),
  component: HomePage,
});
