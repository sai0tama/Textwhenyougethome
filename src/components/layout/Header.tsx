import { Link, useRouterState } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

import { siteLogo } from "@/assets/local";
import { cn } from "@/lib/utils";

const links = [
  { to: "/", label: "Home" },
  { to: "/street-smart", label: "Walks & Workshops" },
  { to: "/what-weve-learned", label: "What we've learned" },
  { to: "/archive", label: "Archive" },
  { to: "/about", label: "About" },
];

export function Header() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  // close the sheet whenever the route changes
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-paper/15 bg-ink text-paper">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:m-2 focus:rounded-md focus:bg-highlight focus:px-4 focus:py-2 focus:font-semibold focus:text-ink"
      >
        Skip to main content
      </a>
      <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between gap-3 px-4 py-3 sm:px-6 md:px-8">
        <Link
          to="/"
          aria-label="Text When You Get Home — Home"
          className="group flex shrink-0 items-center transition-transform hover:-translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-highlight focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
        >
          <img
            src={siteLogo.url}
            alt="#textwhenyougethome"
            width={614}
            height={88}
            decoding="async"
            className="h-6 w-auto max-w-[170px] object-contain sm:h-7 sm:max-w-[200px] md:h-8 md:max-w-[230px]"
          />
        </Link>

        {/* desktop / tablet navigation — unchanged on large screens */}
        <nav className="hidden items-center gap-1 sm:flex sm:gap-1.5 md:gap-2">
          {links.map((link) => {
            const active =
              link.to === "/"
                ? pathname === "/"
                : pathname === link.to || pathname.startsWith(`${link.to}/`);
            return (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  "relative rounded-full px-2.5 py-2 text-xs font-semibold transition-all duration-200 hover:-translate-y-[2px] sm:px-3 sm:text-[13px] md:text-sm",
                  active
                    ? "bg-highlight text-ink"
                    : "text-paper after:absolute after:bottom-1 after:left-3 after:right-3 after:h-[2px] after:origin-left after:scale-x-0 after:bg-highlight after:transition-transform hover:after:scale-x-100",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* mobile menu button */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          className="flex size-11 shrink-0 items-center justify-center rounded-full border-2 border-highlight text-highlight focus:outline-none focus-visible:ring-2 focus-visible:ring-highlight sm:hidden"
        >
          <span className="relative block h-3 w-5">
            <motion.span
              animate={open ? { rotate: 45, y: 5 } : { rotate: 0, y: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 24 }}
              className="absolute left-0 top-0 block h-[2px] w-5 bg-highlight"
            />
            <motion.span
              animate={open ? { opacity: 0 } : { opacity: 1 }}
              className="absolute left-0 top-[5px] block h-[2px] w-5 bg-highlight"
            />
            <motion.span
              animate={open ? { rotate: -45, y: -5 } : { rotate: 0, y: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 24 }}
              className="absolute bottom-0 left-0 block h-[2px] w-5 bg-highlight"
            />
          </span>
        </button>
      </div>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.nav
            id="mobile-nav"
            key="mobile-nav"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-paper/15 sm:hidden"
          >
            <ul className="flex flex-col px-4 py-2">
              {links.map((link) => {
                const active =
                  link.to === "/"
                    ? pathname === "/"
                    : pathname === link.to || pathname.startsWith(`${link.to}/`);
                return (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex min-h-[52px] items-center rounded-full px-5 text-sm font-semibold",
                        active ? "bg-highlight text-ink" : "text-paper",
                      )}
                    >
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </motion.nav>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
