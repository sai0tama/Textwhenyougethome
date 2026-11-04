import { getRouteApi } from "@tanstack/react-router";

import { BeyondTheArchive } from "@/features/home/components/BeyondTheArchive";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Hero } from "@/features/home/components/Hero";
import { HorizontalStatisticsBar } from "@/features/home/components/HorizontalStatisticsBar";
import { InteractiveWorldMapSection } from "@/features/home/components/InteractiveWorldMapSection";
import { NewsletterSection } from "@/features/home/components/NewsletterSection";
import { SocialCommunity } from "@/features/home/components/SocialCommunity";
import { StorySubmissionSection } from "@/features/home/components/StorySubmissionSection";

const routeApi = getRouteApi("/");

export function HomePage() {
  let initialStats = null;
  try {
    const data = routeApi.useLoaderData();
    initialStats = data?.stats ?? null;
  } catch {
    // Fallback if rendered outside router context
  }

  return (
    <div className="min-h-screen overflow-x-clip bg-paper">
      <Header />
      <main id="main-content">
        <Hero />
        <HorizontalStatisticsBar initialStats={initialStats} />
        <InteractiveWorldMapSection />
        <SocialCommunity />
        <BeyondTheArchive />
        <StorySubmissionSection />
        <NewsletterSection />
      </main>
      <Footer />
    </div>
  );
}
