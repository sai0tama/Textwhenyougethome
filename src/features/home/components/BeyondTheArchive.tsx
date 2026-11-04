import { Link } from "@tanstack/react-router";
import { Reveal } from "@/components/ui/Reveal";

interface ActivityCard {
  category: string;
  categoryStyle: string;
  title: string;
  description: string;
  meta: string;
  href: string;
  isExternal?: boolean;
}

const ACTIVITIES: ActivityCard[] = [
  {
    category: "Walk",
    categoryStyle: "bg-[#fef9c3] text-[#713f12]",
    title: "Street Smart",
    description:
      "Two-hour guided neighbourhood walks paying attention to the unwritten rules and street habits we carry.",
    meta: "In-person · Monthly walks",
    href: "/street-smart",
  },
  {
    category: "Make",
    categoryStyle: "bg-[#fce7f3] text-[#831843]",
    title: "Zines for Safer Futures",
    description:
      "Collaborative workshops turning safety habits, shared memories, and collective observations into printed zines.",
    meta: "Workshop · Community created",
    href: "/street-smart",
  },
  {
    category: "Online",
    categoryStyle: "bg-[#dbeafe] text-[#1e40af]",
    title: "Virtual sessions",
    description:
      "Digital listening circles and open conversations connecting people across different cities and time zones.",
    meta: "Online · Interactive",
    href: "/street-smart",
  },
  {
    category: "Imagine",
    categoryStyle: "bg-[#f3e8ff] text-[#581c87]",
    title: "UNSENT",
    description:
      "A collective archive of the messages, unspoken cautions, and thoughts we held back or wished we could send.",
    meta: "Archive · Open prompts",
    href: "/archive",
  },
];

export function BeyondTheArchive() {
  return (
    <section
      aria-label="Beyond the archive activities"
      className="bg-ink px-4 py-16 sm:px-8 sm:py-24 md:py-28 text-paper"
    >
      <div className="mx-auto w-full max-w-[1400px]">
        {/* Header row */}
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <Reveal>
              <span className="font-mono text-xs font-semibold uppercase tracking-[0.25em] text-paper/60">
                BEYOND THE ARCHIVE
              </span>
            </Reveal>
            <Reveal delay={0.06}>
              <h2 className="mt-2 font-display leading-tight tracking-tight text-paper [font-size:clamp(1.75rem,5vw,2.75rem)]">
                We also walk, make and imagine
              </h2>
            </Reveal>
          </div>

          <Reveal delay={0.12}>
            <Link
              to="/what-weve-learned"
              className="inline-flex min-h-[44px] items-center self-start rounded-full border border-paper/30 px-6 py-2.5 font-mono text-xs font-semibold uppercase tracking-wider text-paper transition-all hover:-translate-y-0.5 hover:border-highlight hover:bg-highlight hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-highlight md:self-auto"
            >
              See all sessions →
            </Link>
          </Reveal>
        </div>

        {/* 4 Activity Cards */}
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {ACTIVITIES.map((activity, index) => (
            <Reveal key={activity.title} delay={index * 0.08}>
              <Link
                to={activity.href}
                className="group flex h-full flex-col justify-between rounded-2xl border border-paper/15 bg-white/[0.03] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-paper/35 hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-highlight sm:p-7"
              >
                <div>
                  <span
                    className={`inline-block rounded-full px-3 py-1 font-mono text-[11px] font-semibold tracking-wide ${activity.categoryStyle}`}
                  >
                    {activity.category}
                  </span>
                  <h3 className="mt-4 font-display text-xl text-paper transition-colors group-hover:text-highlight sm:text-2xl">
                    {activity.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-paper/70">
                    {activity.description}
                  </p>
                </div>

                <div className="mt-6 border-t border-paper/10 pt-4 font-mono text-[11px] uppercase tracking-wider text-paper/50">
                  {activity.meta}
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
