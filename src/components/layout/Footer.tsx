import { Link } from "@tanstack/react-router";
import { INSTAGRAM_PROFILE } from "@/features/home/data/socialPosts";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      aria-label="Site footer"
      className="border-t border-paper/15 bg-ink px-4 pt-12 pb-6 sm:px-8 sm:pt-16 sm:pb-8 text-paper"
    >
      <div className="mx-auto w-full max-w-[1400px]">
        {/* Four Column Grid on Desktop */}
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-12">
          {/* Column 1 — Brand */}
          <div className="space-y-4">
            <h2 className="font-display text-xl font-bold tracking-tight text-paper sm:text-2xl">
              Text When You Get Home
            </h2>
            <p className="max-w-xs text-sm leading-relaxed text-paper/70">
              A community and experimental lab by Mudito. Collecting stories since 2024.
            </p>
          </div>

          {/* Column 2 — EXPLORE */}
          <div>
            <h3 className="font-mono text-xs font-semibold uppercase tracking-[0.25em] text-paper/50">
              EXPLORE
            </h3>
            <ul className="mt-5 space-y-3 font-mono text-sm">
              <li>
                <Link
                  to="/archive"
                  className="text-paper/85 transition-colors hover:text-highlight focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-highlight"
                >
                  Stories
                </Link>
              </li>
              <li>
                <a
                  href="/#submit-story"
                  className="text-paper/85 transition-colors hover:text-highlight focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-highlight"
                >
                  Share your story
                </a>
              </li>
              <li>
                <Link
                  to="/street-smart"
                  className="text-paper/85 transition-colors hover:text-highlight focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-highlight"
                >
                  Walks &amp; workshops
                </Link>
              </li>
              <li>
                <Link
                  to="/what-weve-learned"
                  className="text-paper/85 transition-colors hover:text-highlight focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-highlight"
                >
                  What we&apos;ve learned
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3 — CONNECT */}
          <div>
            <h3 className="font-mono text-xs font-semibold uppercase tracking-[0.25em] text-paper/50">
              CONNECT
            </h3>
            <ul className="mt-5 space-y-3 font-mono text-sm">
              <li>
                <a
                  href={INSTAGRAM_PROFILE}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-paper/85 transition-colors hover:text-highlight focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-highlight"
                >
                  Instagram
                </a>
              </li>
              <li>
                <a
                  href="mailto:hello@textwhenyougethome.org"
                  className="text-paper/85 transition-colors hover:text-highlight focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-highlight"
                >
                  hello@textwhenyougethome.org
                </a>
              </li>
              <li>
                <a
                  href="mailto:hello@textwhenyougethome.org?subject=Host%20a%20Walk"
                  className="text-paper/85 transition-colors hover:text-highlight focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-highlight"
                >
                  Host a walk
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4 — CARE */}
          <div>
            <h3 className="font-mono text-xs font-semibold uppercase tracking-[0.25em] text-paper/50">
              CARE
            </h3>
            <ul className="mt-5 space-y-3 font-mono text-sm">
              <li>
                <Link
                  to="/privacy"
                  className="text-paper/85 transition-colors hover:text-highlight focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-highlight"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/terms"
                  className="text-paper/85 transition-colors hover:text-highlight focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-highlight"
                >
                  Terms &amp; Conditions
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom divider and Emergency + Copyright row */}
        <div className="mt-10 border-t border-paper/15 pt-5 sm:mt-12 sm:pt-6">
          <div className="flex flex-col gap-3 text-xs text-paper/60 sm:flex-row sm:items-center sm:justify-between">
            <p>If you are in danger, call 112 (India) or your local emergency number.</p>
            <p>© {currentYear} Mudito</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
