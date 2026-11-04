import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { HostSection } from "@/features/street-smart/components/HostSection";
import { PosterWall } from "@/features/street-smart/components/PosterWall";
import { ProgrammeBlock } from "@/features/street-smart/components/ProgrammeBlock";
import { UpcomingWalks } from "@/features/street-smart/components/UpcomingWalks";

export function StreetSmartPage() {
  return (
    <div className="min-h-screen overflow-x-clip bg-ink">
      <Header />
      <main id="main-content">
        <ProgrammeBlock />
        <UpcomingWalks />
        <PosterWall />
        <HostSection />
      </main>
      <Footer />
    </div>
  );
}
