import { Link, useParams } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Reveal } from "@/components/ui/Reveal";
import { NewsletterSection } from "@/features/home/components/NewsletterSection";
import type { BlogPost } from "./data/blogPosts";
import { getBlogPostBySlug } from "./client/blogQuery";

function formatInline(text: string): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-bold text-ink">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return (
        <em key={i} className="italic text-ink">
          {part.slice(1, -1)}
        </em>
      );
    }
    return part;
  });
}

function renderArticleContent(body: string): ReactNode {
  const sections = body.split("\n\n");

  return sections.map((section, idx) => {
    const trimmed = section.trim();
    if (!trimmed) return null;

    if (trimmed.startsWith("### ")) {
      return (
        <h3
          key={idx}
          className="mt-8 mb-3 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl"
        >
          {trimmed.replace(/^###\s+/, "")}
        </h3>
      );
    }

    if (trimmed.startsWith("## ")) {
      return (
        <h2
          key={idx}
          className="mt-10 mb-4 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl"
        >
          {trimmed.replace(/^##\s+/, "")}
        </h2>
      );
    }

    if (trimmed.startsWith("> ")) {
      return (
        <blockquote
          key={idx}
          className="my-6 border-l-4 border-highlight bg-ink/5 px-6 py-4 italic text-ink"
        >
          {formatInline(trimmed.replace(/^>\s+/, ""))}
        </blockquote>
      );
    }

    if (trimmed.includes("\n- ") || trimmed.startsWith("- ")) {
      const items = trimmed
        .split("\n")
        .filter((l) => l.trim().startsWith("- "))
        .map((l) => l.trim().replace(/^-\s+/, ""));

      return (
        <ul key={idx} className="my-6 space-y-3 pl-6 list-disc text-ink/85">
          {items.map((item, i) => (
            <li key={i} className="text-base sm:text-lg leading-relaxed">
              {formatInline(item)}
            </li>
          ))}
        </ul>
      );
    }

    return (
      <p key={idx} className="text-base sm:text-lg leading-relaxed text-ink/90">
        {formatInline(trimmed)}
      </p>
    );
  });
}

export function ArticleDetailPage() {
  const params = useParams({ strict: false }) as { slug?: string };
  const slug = params.slug ?? "";

  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (!slug) {
      setLoading(false);
      return;
    }

    getBlogPostBySlug(slug)
      .then((res) => {
        if (active) setPost(res);
      })
      .catch((err) => {
        console.error("Failed to load article:", err);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [slug]);

  const formattedDate = post?.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  return (
    <div className="paper-texture grain flex min-h-screen flex-col bg-paper text-ink">
      <Header />

      <main id="main-content" className="flex-1 px-4 py-12 sm:px-6 sm:py-16 md:py-20 lg:px-8">
        {loading ? (
          <section className="mx-auto w-full max-w-[800px] py-16">
            <div className="h-6 w-32 animate-pulse rounded bg-ink/10" />
            <div className="mt-6 h-12 w-3/4 animate-pulse rounded bg-ink/10" />
            <div className="mt-8 space-y-4">
              <div className="h-4 w-full animate-pulse rounded bg-ink/10" />
              <div className="h-4 w-5/6 animate-pulse rounded bg-ink/10" />
              <div className="h-4 w-4/6 animate-pulse rounded bg-ink/10" />
            </div>
          </section>
        ) : !post ? (
          <section className="mx-auto w-full max-w-2xl py-24 text-center sm:py-32">
            <span className="font-mono text-xs uppercase tracking-[0.25em] text-ink/50">
              404 — NOT FOUND
            </span>
            <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              Article not found
            </h1>
            <p className="mt-4 text-ink/70">
              The article or field reflection you are looking for doesn&apos;t exist or has been
              moved.
            </p>
            <div className="mt-8">
              <Link
                to="/what-weve-learned"
                className="inline-flex items-center gap-2 rounded-full border border-ink/20 bg-ink/5 px-5 py-2.5 font-mono text-xs font-semibold uppercase tracking-wider text-ink transition-all hover:bg-ink hover:text-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
              >
                <ArrowLeft className="size-4" />
                <span>Back to What we&apos;ve learned</span>
              </Link>
            </div>
          </section>
        ) : (
          <article className="mx-auto w-full max-w-[800px]">
            {/* Back navigation link */}
            <Reveal>
              <Link
                to="/what-weve-learned"
                className="group inline-flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-wider text-ink/70 transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
              >
                <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-1" />
                <span>Back to What we&apos;ve learned</span>
              </Link>
            </Reveal>

            {/* Post Number, Category Pill, and Reading Time */}
            <Reveal delay={0.05}>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                {post.postNumber && (
                  <span className="font-mono text-xs font-bold uppercase tracking-[0.25em] text-ink/60">
                    {post.postNumber}
                  </span>
                )}
                <span className="rounded-full border border-ink/20 bg-ink/5 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-ink">
                  {post.category}
                </span>
                {post.readingTime && (
                  <span className="font-mono text-xs font-medium tracking-wider text-ink/60">
                    {post.readingTime}
                  </span>
                )}
              </div>
            </Reveal>

            {/* Article Title */}
            <Reveal delay={0.1}>
              <h1 className="mt-4 font-display text-3xl font-extrabold leading-[1.15] tracking-tight text-ink sm:text-4xl md:text-5xl lg:text-[3.25rem]">
                {post.title}
              </h1>
            </Reveal>

            {/* Hairline Divider matching PDF */}
            <div className="my-5 h-[2px] w-full bg-[#8c1d40]/25" />

            {/* Subtitle / Accompanying Introductory Line */}
            {post.subtitle && (
              <Reveal delay={0.15}>
                <p className="font-display italic text-lg sm:text-xl md:text-2xl font-normal leading-relaxed text-ink/80">
                  {post.subtitle}
                </p>
              </Reveal>
            )}

            {/* Optional Metadata Row (Only rendered if real data exists) */}
            {(post.author || formattedDate) && (
              <div className="mt-6 flex flex-wrap items-center gap-4 border-b border-ink/10 pb-4 font-mono text-xs text-ink/60">
                {post.author && <span>By {post.author}</span>}
                {formattedDate && <span>· {formattedDate}</span>}
              </div>
            )}

            {/* Main Body Prose */}
            <div className="mt-8 space-y-6 text-ink/90">{renderArticleContent(post.body)}</div>

            {/* "Try this:" Prompt Callout Box (Only present on articles that supply one) */}
            {post.tryThis && (
              <Reveal delay={0.2}>
                <div className="mt-12 rounded-r-lg border-l-4 border-[#b93b48] bg-[#faebeb] p-5 sm:p-6 text-ink shadow-sm">
                  <p className="text-base sm:text-lg leading-relaxed">
                    <strong className="font-semibold text-ink">Try this:</strong>{" "}
                    <span className="italic text-ink/90">{post.tryThis}</span>
                  </p>
                </div>
              </Reveal>
            )}

            {/* Bottom Back Navigation */}
            <div className="mt-16 border-t border-ink/15 pt-8 flex items-center justify-between">
              <Link
                to="/what-weve-learned"
                className="inline-flex items-center gap-2 rounded-full border border-ink/20 bg-ink/5 px-5 py-2.5 font-mono text-xs font-semibold uppercase tracking-wider text-ink transition-all hover:bg-ink hover:text-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
              >
                <ArrowLeft className="size-4" />
                <span>Back to What we&apos;ve learned</span>
              </Link>
            </div>
          </article>
        )}
      </main>

      <NewsletterSection />
      <Footer />
    </div>
  );
}
