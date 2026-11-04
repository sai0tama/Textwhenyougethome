import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import type { BlogPost } from "../data/blogPosts";
import { getCardTheme } from "../data/blogPosts";

interface BlogCardProps {
  post: BlogPost;
  index: number;
}

export function BlogCard({ post, index }: BlogCardProps) {
  const theme = getCardTheme(index);

  const formattedDate = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";

  return (
    <article
      style={{ backgroundColor: theme.bg }}
      className="group relative flex flex-col justify-between rounded-2xl border border-ink/20 p-6 sm:p-7 md:p-8 text-ink shadow-[4px_4px_0_rgba(0,2,1,0.9)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[6px_6px_0_rgba(0,2,1,0.9)]"
    >
      {/* Primary Accessible Link spanning whole card */}
      <Link
        to="/what-weve-learned/$slug"
        params={{ slug: post.slug }}
        className="absolute inset-0 z-0 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
        aria-label={`Read article: ${post.title}`}
      />

      {/* Top Header: Category Pill & Reading Time */}
      <div className="relative z-10 pointer-events-none">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink/10 pb-4">
          <span
            style={{ backgroundColor: theme.tagBg, color: theme.tagText }}
            className="rounded-full px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.2em]"
          >
            {post.category}
          </span>
          {post.readingTime && (
            <span className="font-mono text-[11px] font-semibold tracking-wider text-ink/70">
              {post.readingTime}
            </span>
          )}
        </div>

        {/* Title & Excerpt */}
        <div className="mt-5">
          <h3 className="font-display text-xl font-bold leading-snug tracking-tight text-ink sm:text-2xl group-hover:underline">
            {post.title}
          </h3>

          {post.excerpt && (
            <p className="mt-3.5 text-sm leading-relaxed text-ink/80 sm:text-base">
              {post.excerpt}
            </p>
          )}
        </div>
      </div>

      {/* Footer: Metadata (if any) and Read Button */}
      <div className="relative z-10 pointer-events-none mt-8 border-t border-ink/10 pt-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            {post.author && (
              <p className="truncate font-mono text-[11px] font-semibold text-ink/90 uppercase tracking-wider">
                {post.author}
              </p>
            )}
            {formattedDate && (
              <p className="font-mono text-[10px] text-ink/60 tracking-wider">{formattedDate}</p>
            )}
          </div>

          <span className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-ink/30 bg-ink/5 px-3 py-1.5 font-mono text-xs font-semibold uppercase tracking-wider text-ink transition-colors group-hover:bg-ink group-hover:text-paper">
            <span>Read</span>
            <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </span>
        </div>
      </div>
    </article>
  );
}
