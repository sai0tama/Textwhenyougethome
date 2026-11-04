import { motion } from "motion/react";

import { Reveal } from "@/components/ui/Reveal";
import { filters, type FilterId } from "@/shared/filters";
import { cn } from "@/lib/utils";

/** Each theme keeps its own colour at all times, exactly like the reference row. */
const fill: Record<FilterId, string> = {
  "safety-care": "bg-note-pink",
  "known-distance": "bg-note-yellow",
  "after-dark": "bg-note-orange",
  "random-incident": "bg-note-mint",
  "walking-us": "bg-note-blue",
  others: "bg-note-purple",
};

export function ArchiveFilters({
  active,
  onChange,
}: {
  active: FilterId | null;
  onChange: (id: FilterId | null) => void;
}) {
  return (
    <div className="bg-ink px-4 pb-10 pt-6 sm:px-8 sm:pb-12">
      <Reveal className="mx-auto w-full max-w-[1400px]">
        <div className="flex flex-wrap justify-center gap-2.5 sm:gap-3 md:justify-start md:pl-[10%]">
          {filters.map((filter) => {
            const isActive = active === filter.id;
            return (
              <motion.button
                key={filter.id}
                type="button"
                aria-pressed={isActive}
                onClick={() => onChange(isActive ? null : filter.id)}
                whileHover={{ y: -2, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300, damping: 22 }}
                className={cn(
                  "inline-flex min-h-[44px] items-center rounded-full px-5 py-2.5 text-[13px] font-medium text-ink sm:px-6 sm:text-sm",
                  fill[filter.id],
                  isActive
                    ? "ring-2 ring-highlight ring-offset-2 ring-offset-ink"
                    : "opacity-90 hover:opacity-100",
                )}
              >
                {filter.archiveLabel}
              </motion.button>
            );
          })}
        </div>

        <p className="mx-auto mt-8 max-w-2xl text-center text-[0.95rem] leading-loose text-paper/80 sm:mt-10 sm:text-lg">
          More than 600 people, each on a card. We marked them in six different ways to help you
          find the stories that connect with yours.
        </p>
      </Reveal>
    </div>
  );
}
