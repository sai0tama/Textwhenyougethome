import { createFileRoute } from "@tanstack/react-router";

import { ArticleDetailPage } from "@/features/what-weve-learned/ArticleDetailPage";
import { FALLBACK_BLOG_POSTS } from "@/features/what-weve-learned/client/blogQuery";

export const Route = createFileRoute("/what-weve-learned/$slug")({
  head: ({ params }) => {
    const post = FALLBACK_BLOG_POSTS.find((p) => p.slug === params.slug);
    const title = post
      ? `${post.title} — What we've learned — Text When You Get Home`
      : "What we've learned — Text When You Get Home";
    const description =
      post?.subtitle ||
      post?.excerpt ||
      "Field notes, research takeaways, and urban safety essays from Text When You Get Home.";

    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: ArticleDetailPage,
});
