import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import { FloatingInstagram } from "@/components/layout/FloatingInstagram";
import { INSTAGRAM_PROFILE } from "@/features/home/data/socialPosts";
import appCss from "../styles.css?url";

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      name: "Street Speak Archive",
      alternateName: "TextWhenYouGetHome",
      description:
        "A community archive of real-world safety habits, walks, observations and stories.",
      sameAs: [INSTAGRAM_PROFILE],
    },
    {
      "@type": "WebSite",
      name: "Street Speak Archive",
      alternateName: "#textwhenyougethome",
    },
  ],
};

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ink px-4 py-16 text-paper">
      <div className="relative mx-auto w-full max-w-lg text-center">
        <span className="font-mono text-xs uppercase tracking-[0.3em] text-paper/60">
          Error 404 · Uncharted Route
        </span>
        <h1 className="mt-3 font-display text-7xl font-bold tracking-tight text-highlight sm:text-9xl">
          404
        </h1>
        <h2 className="mt-4 font-display text-2xl tracking-tight text-paper sm:text-3xl">
          The lane ends here.
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-paper/75 sm:text-base">
          The page or street you're looking for doesn't exist, has moved, or was quietly archived.
        </p>
        <p className="mt-5 font-hand text-2xl text-paper/70">head back toward the lights →</p>
        <div className="mt-8 flex justify-center">
          <Link
            to="/"
            className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-highlight px-8 py-3 text-sm font-semibold text-ink physical-shadow transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-highlight focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
          >
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ink px-4 py-16 text-paper">
      <div className="relative mx-auto w-full max-w-lg text-center">
        <span className="font-mono text-xs uppercase tracking-[0.3em] text-note-pink">
          System Signal Interrupted
        </span>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-highlight sm:text-4xl">
          This page didn't load.
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-paper/75 sm:text-base">
          Something went quiet on our end. You can attempt to reconnect or return to the main
          archive.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-highlight px-7 py-2.5 text-sm font-semibold text-ink physical-shadow transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-highlight focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
          >
            Try again
          </button>
          <Link
            to="/"
            className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-paper/40 bg-transparent px-7 py-2.5 text-sm font-semibold text-paper transition-all hover:-translate-y-0.5 hover:border-highlight hover:text-highlight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-highlight focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
          >
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Street Smart — #textwhenyougethome" },
      {
        name: "description",
        content:
          "A community archive of real-world safety habits, walks, observations and stories.",
      },
      { name: "author", content: "Street Smart" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Archivo+Black&family=Caveat:wght@600;700&family=JetBrains+Mono:wght@400;500&family=Poppins:wght@400;500;600;700;800&display=swap",
      },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      { rel: "icon", href: "/favicon.png", type: "image/png", sizes: "256x256" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
      <FloatingInstagram />
    </QueryClientProvider>
  );
}
