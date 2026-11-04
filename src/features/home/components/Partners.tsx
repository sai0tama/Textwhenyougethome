import { motion, useReducedMotion } from "motion/react";
import { partners } from "@/features/home/data/partners";

export function Partners() {
  const shouldReduceMotion = useReducedMotion();
  const dhPartner = partners.find((p) => p.id === "deccan-herald") ?? {
    id: "deccan-herald",
    name: "Deccan Herald",
    logo: "/assets/partners/deccan-herald.svg",
    href: "https://www.deccanherald.com",
  };

  const headerVariants = {
    hidden: { opacity: shouldReduceMotion ? 1 : 0, y: shouldReduceMotion ? 0 : 10 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: shouldReduceMotion ? 0 : 0.5, ease: [0.22, 1, 0.36, 1] as const },
    },
  };

  const logoVariants = {
    hidden: { opacity: shouldReduceMotion ? 1 : 0, scale: shouldReduceMotion ? 1 : 0.95 },
    show: {
      opacity: 1,
      scale: 1,
      transition: { duration: shouldReduceMotion ? 0 : 0.5, ease: [0.22, 1, 0.36, 1] as const },
    },
  };

  return (
    <section
      aria-label="Our Partners"
      className="border-y border-paper/15 bg-ink px-4 py-4 text-paper sm:px-8 sm:py-5 md:py-6"
    >
      <div className="mx-auto flex w-full max-w-[1400px] flex-col items-center justify-center text-center">
        {/* Section Header: OUR PARTNERS */}
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          variants={headerVariants}
          className="mb-3 sm:mb-4"
        >
          <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-paper/60 sm:text-[10px]">
            OUR PARTNERS
          </span>
        </motion.div>

        {/* Single Centered Compact Deccan Herald Logo */}
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          variants={logoVariants}
          className="flex w-full items-center justify-center px-4"
        >
          <a
            href={dhPartner.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Visit ${dhPartner.name}`}
            className="group flex items-center justify-center rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-highlight"
          >
            <img
              src={dhPartner.logo}
              alt={dhPartner.name}
              loading="lazy"
              decoding="async"
              className="h-4 w-auto max-w-[65vw] object-contain opacity-85 transition-all duration-300 group-hover:scale-[1.03] group-hover:opacity-100 sm:h-5 md:h-6 lg:h-7"
            />
          </a>
        </motion.div>
      </div>
    </section>
  );
}
