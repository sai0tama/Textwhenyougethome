import { useEffect, useMemo, useState } from "react";
import { Reveal } from "@/components/ui/Reveal";
import type { BlogPost } from "../data/blogPosts";
import { getBlogPosts } from "../client/blogQuery";
import { BlogCard } from "./BlogCard";

export function BlogGrid() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  useEffect(() => {
    let active = true;
    getBlogPosts()
      .then((res) => {
        if (active && res.status === "success" && res.data) {
          setPosts(res.data);
        }
      })
      .catch((err) => {
        console.error("Failed to load blog posts:", err);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const CATEGORIES = ["ALL", "COMMUNITY WALKS", "ARCHIVE FINDINGS", "STREET DESIGN"];

  const filteredPosts = useMemo(() => {
    if (selectedCategory === "ALL") return posts;
    return posts.filter((p) => p.category.toUpperCase() === selectedCategory.toUpperCase());
  }, [posts, selectedCategory]);

  return (
    <section
      aria-label="Notes from the streets"
      className="paper-texture grain relative border-t border-ink/15 px-4 py-16 sm:px-6 sm:py-24 md:py-28 lg:px-8"
    >
      <div className="mx-auto w-full max-w-[1400px]">
        {/* Section Header */}
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <Reveal>
              <span className="font-mono text-xs font-semibold uppercase tracking-[0.25em] text-ink/60">
                FIELD ARCHIVE &amp; ESSAYS
              </span>
            </Reveal>

            <Reveal delay={0.05}>
              <h2 className="mt-3 font-display text-3xl font-bold leading-tight tracking-tight text-ink sm:text-4xl md:text-5xl">
                Notes from the streets
              </h2>
            </Reveal>

            <Reveal delay={0.1}>
              <p className="mt-4 text-sm leading-relaxed text-ink/75 sm:text-base md:text-lg">
                Essays, walking audits, and design takeaways from our research on safety,
                infrastructure, and emotional cartographies.
              </p>
            </Reveal>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`rounded-full px-3.5 py-1.5 font-mono text-xs font-semibold tracking-wider transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink ${
                    isActive
                      ? "bg-ink text-paper shadow-sm"
                      : "border border-ink/20 bg-ink/5 text-ink/80 hover:bg-ink/10"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Grid */}
        <div className="mt-12 sm:mt-16">
          {loading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-80 animate-pulse rounded-xl border border-ink/10 bg-ink/5 p-6"
                />
              ))}
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-ink/20 p-12 text-center">
              <p className="font-mono text-sm text-ink/70">
                No articles published in this category yet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:gap-8">
              {filteredPosts.map((post, index) => (
                <BlogCard key={post.id} post={post} index={index} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
