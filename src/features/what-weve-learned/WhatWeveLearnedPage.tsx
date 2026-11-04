import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { NewsletterSection } from "@/features/home/components/NewsletterSection";
import { HearingInteraction } from "@/features/street-smart/components/HearingInteraction";
import { BlogGrid } from "./components/BlogGrid";

export function WhatWeveLearnedPage() {
  return (
    <div className="min-h-screen overflow-x-clip bg-ink text-paper">
      <Header />
      <main id="main-content">
        <h1 className="sr-only">What We&apos;ve Learned — Text When You Get Home</h1>

        {/* Reference 1: Things we keep on hearing section (relocated from Street Smart) */}
        <HearingInteraction />

        {/* Reference 2: Editorial card-grid blog section ("Notes from the streets") */}
        <BlogGrid />

        {/* Community Newsletter Sign-up */}
        <NewsletterSection />
      </main>
      <Footer />
    </div>
  );
}
