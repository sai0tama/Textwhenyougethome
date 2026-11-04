# Street Smart — Wix Integration Plan

> **Status: audit + preparation only.** No CMS collections, backend code, or Wix packages have been
> created. The exact Wix deployment/integration architecture is **not finalised** — nothing in this
> document assumes a specific hosting method. Produced by a read-only audit of the existing codebase;
> no UI, routing, or functionality was changed.

---

## A. Current architecture

### Frontend stack

| Layer        | What is used                                                                                                                                |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework    | TanStack Start 1.168 (SSR via Nitro) + TanStack Router 1.170 (file-based routes, generated `src/routeTree.gen.ts`)                          |
| Data / cache | TanStack Query 5 — provider mounted in `src/routes/__root.tsx`; **no queries exist yet**                                                    |
| UI           | React 19, Tailwind CSS v4, shadcn/ui (new-york) + Radix primitives, `motion` animations, `d3-geo` + `topojson-client` (world map), `sonner` |
| Forms        | `react-hook-form` + `zod` are installed but **unused**; the live form is plain `useState`                                                   |
| Build        | Vite 8 with TanStack Start, React, Tailwind CSS, and Nitro (`cloudflare-module` preset)                                                     |
| Language     | TypeScript 5.8 strict, path alias `@/* → src/*`                                                                                             |
| Server entry | Custom `src/server.ts` (h3 error normalisation wrapper) + `src/start.ts` (error + CSRF middleware for server functions)                     |
| Origin       | Standalone TanStack Start web app; no `index.html` — the HTML shell is `shellComponent` in `src/routes/__root.tsx`                          |

### Routes / pages

| Route           | Page file                   | Sections                                                                                                                        |
| --------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `/`             | `src/pages/Home.tsx`        | `Hero`, `WhyThisExists`, `StoryCounter` (+ `InteractiveWorldMap`), `WhatWeDo`, `SocialCommunity`, `ClosingNote` (+ `StoryForm`) |
| `/archive`      | `src/pages/Archive.tsx`     | `ArchiveHeader`, `ArchiveFilters`, `NoteStack`, `StorySubmission` (`StoryForm`, `AudioRecorder`, `PhotoSubmission`)             |
| `/street-smart` | `src/pages/StreetSmart.tsx` | `StreetHero`, `WhatThisIs`, `PosterWall`, `VirtualEdition`, `HearingInteraction`, `UpcomingWalks`                               |
| shared          | `src/routes/__root.tsx`     | `Header`, `Footer` per page; root 404 + error boundary                                                                          |

### Current data sources — 100% static, no network data layer

- Content constants in `src/data/*.ts` (see Section D) are imported **directly** by components; there is no fetch layer, no API client, and no database anywhere in the app.
- Binary images live in `public/assets/*` referenced through the URL table `src/assets/local.ts` (this already replaced a hosted-asset pipeline while keeping a `{ url }` shape so component code is unchanged).
- `public/data/land-110m.json` is fetched client-side by the world map (static basemap geometry, not editorial content).
- Only outbound network references: Google Fonts CDN (`src/routes/__root.tsx` head) and the Instagram profile URL in `src/data/socialPosts.ts`.

### Forms (all client-only today)

1. **StoryForm** — `src/components/ui/StoryForm.tsx`. Fields: name, age, city+country (single input), story, optional theme tag (`FilterId`). Plain `useState` + client-side validation. The success panel says: _"Nothing is stored yet — this archive isn't wired to a database, so your words stay in this browser session."_ Rendered in **two** places: `ClosingNote` (home) and `StorySubmission` (archive).
2. **AudioRecorder** — `src/components/archive/AudioRecorder.tsx`. Real `MediaRecorder` capture → Blob (`audio/webm`) → object-URL `<audio>` preview + local download link. **Never uploaded.**
3. **PhotoSubmission** — `src/components/archive/PhotoSubmission.tsx`. Hidden `input[type=file]` + drag-&-drop; `image/*` only, ≤ 8 MB client check; object-URL preview. **Never uploaded.**

### Member / user functionality

None. No auth, no accounts, no member area; submissions are anonymous (the name is typed into the form).

---

## B. Wix data requirements

Proposed collections (to be created **only after the architecture is confirmed**). Field names mirror the current TypeScript shapes so the mock → CMS swap stays mechanical.

**Stories** — archive notes (feeds `NoteStack`; optionally map pins)

- `name` (text), `age` (number), `city` (text), `country` (text), `story` (text), `theme` (ref Themes), `color` (orange|pink|yellow|blue|green), `status` (pending|approved|rejected), `submittedVia` (form|walk|web), `coordinates` (optional lat/lon), `submittedAt` (date), `approvedAt`, `moderationNotes`

**StorySubmissions** — write path of `StoryForm`

- Same shape as Stories. Recommended: write directly into `Stories` with `status=pending`; a separate intake collection is only needed if intake must be decoupled from the archive. Add optional `contactEmail`, `consent` (bool), `spamScore`.

**Events** — upcoming walks (feeds `UpcomingWalks`)

- `date` (Date/Time — the mock uses display strings without a year), `place` (text), `city` (text), `registrationUrl` (URL; per-walk — currently falls back to the Instagram profile), `description` (optional), `poster` (image, optional), `isPublished` (bool), `sortOrder` (number; preserves the current list order)

**PastEvents** — poster wall (feeds `PosterWall`)

- `title`, `caption` (location line, e.g. "Shivajinagar · Bengaluru"), `image` (Wix Media), `date` (optional), `walkNumber` (optional). Note: `pos {left, top, width, rotate}` in the mock is purely presentational — keep the pinned layout in code, store content only.

**VirtualEdition** — singleton content item (feeds `VirtualEdition`)

- `title`, `poster` (Wix Media), `body` (text), `ctaLabel`, `registrationUrl`

**SocialPosts** — feeds `SocialCommunity`

- `title`, `image` (Wix Media), `platform` (currently always "Instagram"), `postedAt` (Date — mock uses strings like "12 May 2026"), `instagramUrl` (per-post permalink; currently the profile URL)

**CityNotes** — map pins (feeds `InteractiveWorldMap`)

- `city`, `country`, `latitude` (number), `longitude` (number), `story`, `theme`, `isPublished`. Alternative: derive from approved `Stories` that carry coordinates — product decision needed.

**AudioSubmissions** — write path of `AudioRecorder`

- `audioFile` (Wix Media), `mimeType`, `durationSeconds`, `submitterName` (optional), `contact` (optional), `status`, `createdAt`

**PhotoSubmissions** — write path of `PhotoSubmission`

- `imageFile` (Wix Media), `caption` ("a few words about it"), `submitterName` (optional), `contact` (optional), `status`, `createdAt`

**Themes** — reference collection for the 5 filter tags (feeds `ArchiveFilters`, the `StoryForm` tag picker, and the `StoryCounter` pills)

- `id` (`safety-care` …), `label`, `archiveLabel`, `displayColor`, `sortOrder`. Low urgency — can remain a TS constant at first.

**SiteStats** — singleton (feeds `StoryCounter`)

- `displayedCount`, `targetCount`, `subtitle`, `pinnedNote`. Alternative: compute the count from approved `Stories` (the mock values 571/638 are deliberately fuzzy).

**EarStories** — "Things we keep on hearing" (feeds `HearingInteraction`)

- `story`, `who` ("Bengaluru · 26"), `theme` (optional), `isPublished`. Layout fields (`x/y/size/rotate/tail/flip`) are presentational — keep in code.

**SiteSettings** — singleton

- `hashtag` (#textwhenyougethome), `instagramProfileUrl`, `partnerLine` (Footer "DECCAN HERALD")

**Backend functionality needed later (Velo — do not build yet)**

- Public read endpoints (Wix Data queries) filtered to `isPublished` / `status=approved`
- Submission intake with server-side validation, rate limiting / spam protection, and CORS handling if the app is served from a different origin
- Upload flow: backend-issued Wix Media upload URL → client uploads the file → metadata row written to Audio/PhotoSubmissions
- Moderation: the Wix Studio CMS UI is sufficient initially for approve/reject

---

## C. Frontend → Wix integration points

### Read paths — replace direct `src/data/*` imports with a typed data layer (suggest `src/lib/api/*`) used through TanStack Query

| File                                                                              | Reads today      | Wix replacement                                           |
| --------------------------------------------------------------------------------- | ---------------- | --------------------------------------------------------- |
| `src/components/archive/NoteStack.tsx`                                            | `archiveNotes`   | `Stories` (approved, theme filter, random pick)           |
| `src/components/home/InteractiveWorldMap.tsx`                                     | `cities`         | `CityNotes` (or approved `Stories` with coordinates)      |
| `src/components/home/StoryCounter.tsx`                                            | `storyCounter`   | `SiteStats` (or computed approved-Stories count)          |
| `src/components/home/SocialCommunity.tsx`                                         | `socialPosts`    | `SocialPosts`                                             |
| `src/components/street-smart/UpcomingWalks.tsx`                                   | `upcomingWalks`  | `Events` (`isPublished`, sorted)                          |
| `src/components/street-smart/PosterWall.tsx`                                      | `pastEvents`     | `PastEvents`                                              |
| `src/components/street-smart/VirtualEdition.tsx`                                  | `virtualEdition` | `VirtualEdition` singleton                                |
| `src/components/street-smart/HearingInteraction.tsx`                              | `earStories`     | `EarStories`                                              |
| `src/data/filters.ts` (consumed by `ArchiveFilters`, `StoryForm`, `StoryCounter`) | `filters`        | `Themes` reference collection (optional; may stay static) |
| `src/data/stories.ts` → `HASHTAG` (consumed by `Hero`, `Header`, `Footer`)        | constant         | `SiteSettings.hashtag` (optional; may stay static)        |

### Write paths

| File                                                                                                         | Today                            | Wix replacement                                               |
| ------------------------------------------------------------------------------------------------------------ | -------------------------------- | ------------------------------------------------------------- |
| `src/components/ui/StoryForm.tsx` (rendered by `ClosingNote` on `/` **and** `StorySubmission` on `/archive`) | local state only, nothing stored | create `Stories`/`StorySubmissions` row with `status=pending` |
| `src/components/archive/AudioRecorder.tsx`                                                                   | Blob held in memory              | upload to Wix Media → `AudioSubmissions` row                  |
| `src/components/archive/PhotoSubmission.tsx`                                                                 | object-URL preview only          | upload to Wix Media → `PhotoSubmissions` row                  |

Natural fetch locations: the route files `src/routes/index.tsx`, `src/routes/archive.tsx`, `src/routes/street-smart.tsx` — the TanStack Query provider is already mounted in the root, so loaders/queries there keep pages visually identical while data moves.

Keep `src/data/*` as offline fallbacks until each Wix source is verified, then remove the imports (keep the files) so rollback stays trivial.

---

## D. Current mock data → future Wix data

| Mock source (today)                                       | Consumed by                                   | Proposed Wix collection / fields                                                                              |
| --------------------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `src/data/archiveNotes.ts` (10 notes)                     | `NoteStack`                                   | `Stories`: name, age, city, story, color, theme (=filterId), status=approved                                  |
| `src/data/cities.ts` (20 cities)                          | `InteractiveWorldMap`                         | `CityNotes`: name, country, coordinates→latitude/longitude, story, theme                                      |
| `src/data/events.ts` → `upcomingWalks` (3)                | `UpcomingWalks`                               | `Events`: date, place, city, registrationUrl                                                                  |
| `src/data/events.ts` → `pastEvents` (4)                   | `PosterWall`                                  | `PastEvents`: title, caption, image                                                                           |
| `src/data/events.ts` → `virtualEdition`                   | `VirtualEdition`                              | `VirtualEdition` singleton: title, poster, body, ctaLabel, registrationUrl                                    |
| `src/data/events.ts` → `REGISTRATION_FALLBACK`            | all walk + virtual CTAs                       | per-event `registrationUrl`; profile URL → `SiteSettings`                                                     |
| `src/data/socialPosts.ts` (4 posts + `INSTAGRAM_PROFILE`) | `SocialCommunity`                             | `SocialPosts`: title, image, platform, postedAt, instagramUrl; profile → `SiteSettings`                       |
| `src/data/earStories.ts` (3)                              | `HearingInteraction`                          | `EarStories`: story, who                                                                                      |
| `src/data/stories.ts` → `storyCounter`                    | `StoryCounter`                                | `SiteStats` singleton (or computed from approved Stories)                                                     |
| `src/data/stories.ts` → `HASHTAG`                         | `Hero`, `Header`, `Footer`                    | `SiteSettings.hashtag`                                                                                        |
| `src/data/filters.ts` (5 themes)                          | `ArchiveFilters`, `StoryForm`, `StoryCounter` | `Themes` reference (optional initially)                                                                       |
| `src/assets/local.ts` (posters, social images, artwork)   | various                                       | Wix Media files referenced by image fields (`PastEvents.image`, `SocialPosts.image`, `VirtualEdition.poster`) |
| `public/data/land-110m.json`                              | map basemap                                   | **Not CMS data** — static geometry; keep bundled with the app                                                 |

---

## E. File upload requirements

### Audio — `src/components/archive/AudioRecorder.tsx`

- **Today:** `navigator.mediaDevices.getUserMedia({audio:true})` → `MediaRecorder` → chunks → `Blob` (type `rec.mimeType || "audio/webm"`) → `URL.createObjectURL` → `<audio>` preview + "Download" anchor (`street-smart-note.webm`). Nothing leaves the browser. No duration cap (the timer is display-only) and no size cap.
- **Will need later:** POST the Blob through the Wix Media upload flow (backend-issued upload URL), then write `audioFile` / `mimeType` / `durationSeconds` to `AudioSubmissions`; add a client duration/size guard; **iOS Safari records mp4, not webm** — the endpoint and Wix Media must accept both containers (verify WebM support in Wix Media Manager); `getUserMedia` requires HTTPS and, if the app is ever embedded in an iframe, `allow="microphone"`.

### Photo — `src/components/archive/PhotoSubmission.tsx`

- **Today:** hidden `input[type=file] accept="image/*"` + drag-&-drop → validates `image/*` and ≤ 8 MB → `URL.createObjectURL` preview only. Nothing leaves the browser; there is no submit/consent step yet.
- **Will need later:** upload the `File` to Wix Media (same flow as audio) → `PhotoSubmissions` row with `imageFile` + optional caption/submitter fields; mirror the 8 MB cap server-side.

### Shared requirements

Upload progress + success/failure states (the UI today has none beyond inline error text), a consent/privacy step for voice recordings, a moderation gate before anything appears publicly, and a retention policy for rejected submissions.

---

## F. Risks / compatibility

1. **SSR vs Wix hosting (biggest).** TanStack Start is a Node SSR app (Nitro). Wix Studio does not host arbitrary Node servers; if the React app must be served _by_ Wix, it needs to be a static/SPA export or embedded (iframe/custom element), which changes current SSR behaviour. All page components are already client-safe (browser APIs run inside `useEffect`), so a static export is viable — but that decision is pending and must not be assumed here.
2. **Cross-origin API.** If the app stays on its current host and calls Wix (HTTP functions / wix-data REST), CORS, auth (API key vs visitor token) and CSRF must be designed; today there are no request credentials at all.
3. **MediaRecorder formats.** Chrome/Android → `audio/webm`; iOS Safari → `mp4`. Verify Wix Media accepts both; keep the existing "Recording isn't supported in this browser" fallback for unsupported browsers.
4. **Date shapes.** Walk dates ("28 June") and post dates ("12 May 2026") are display strings with no year/timezone. CMS needs real Date fields plus a formatting step to preserve the current look exactly.
5. **Volume assumptions.** `NoteStack` slices to 5 notes while the copy claims "more than 600". A real dataset needs pagination/lazy loading and a rethink of "read a random one" (currently random over a 5-note pool). The counters (571/638) are deliberately fuzzy — decide computed vs curated.
6. **Moderation/spam.** Intake is anonymous with zero protection. Collections need a `status` gate or the archive fills with spam. The `StoryForm` success copy explicitly says nothing is stored — **must be updated once persistence is real** (text-only change; deliberately not made in this audit).
7. **Two form mount points.** `StoryForm` renders on both `/` and `/archive` — one shared submit path, but both instances must be regression-tested after integration.
8. **Upload UX gaps.** No progress/success/retry states exist; additions will be needed later and must match the existing visual language (no redesign).
9. **Relative static fetch.** `fetch("/data/land-110m.json")` must resolve wherever the app is hosted; if served/embedded on the Wix domain, the JSON must ship with the bundle (~1 MB of geometry — not suitable for CMS).
10. **Fonts via Google CDN.** Fine standalone; if the app ends up embedded under Wix with a restrictive CSP, self-host the fonts.
11. **Git safety.** Per `AGENTS.md`, never rewrite published git history (no force-push/rebase) — normal commits only.
12. **Build pipeline.** Nitro defaults to a Cloudflare target (`cloudflare-module`) and `.output/wrangler.json` is generated; if deployment moves, revisit the Nitro target (static/Node) — do not touch until the architecture is confirmed.
13. **Anchor navigation.** The `#upcoming-walks` link in `PosterWall` relies on TanStack scroll handling — unaffected by data changes, but re-verify after any SPA/SSR switch.

---

## G. Recommended next steps (safest order once the architecture is confirmed)

1. **Decide the deployment architecture** — (a) React app stays on its current host and calls Wix HTTP functions / wix-data REST; (b) static SPA export served or embedded on the Wix domain; (c) rebuild the UI in Wix Studio (explicitly _not_ assumed). Everything below works for (a) and (b).
2. **Create the CMS collections** from Section B in Wix Studio (fields above) and seed them with the current mock content so editors validate against realistic data. _No collections were created in this audit._
3. **Read-only first:** build the public read API (Velo HTTP functions or wix-data REST) and a thin typed data layer (`src/lib/api/*`) consumed through TanStack Query, with mock fallbacks. Swap sources one section at a time in this order: Events/UpcomingWalks → SocialPosts → PastEvents/VirtualEdition → Stories/NoteStack → CityNotes/map → SiteStats.
4. **Submission intake:** wire `StoryForm` (both mount points) to create `Stories`/`StorySubmissions` rows with `status=pending`; add server-side validation, rate limiting and spam protection; keep the form UI untouched.
5. **File uploads:** photo first (simpler), then audio, via backend-issued Wix Media upload URLs; mirror the 8 MB cap server-side; decide audio duration caps and webm/mp4 handling.
6. **Copy update:** change the "Nothing is stored yet…" success message once persistence is real.
7. **Media migration:** move posters/social images into Wix Media only after URLs are stable; keep `src/assets/local.ts` as fallback until then.
8. **QA pass:** SSR/SPA parity, CORS, iOS recording fallback, empty/error/loading states per collection, and the moderation workflow end-to-end.
