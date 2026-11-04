import { useState } from "react";

import { ArchiveFilters } from "@/features/archive/components/ArchiveFilters";
import { ArchiveHeader } from "@/features/archive/components/ArchiveHeader";
import { NoteStack } from "@/features/archive/components/NoteStack";
import { StorySubmission } from "@/features/submissions/components/StorySubmission";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import type { FilterId } from "@/shared/filters";

export function ArchivePage() {
  const [active, setActive] = useState<FilterId | null>(null);

  return (
    <div className="min-h-screen overflow-x-clip bg-ink">
      <Header />
      <main id="main-content">
        <ArchiveHeader />
        <ArchiveFilters active={active} onChange={setActive} />
        <NoteStack activeFilter={active} />
        <StorySubmission />
      </main>
      <Footer />
    </div>
  );
}
