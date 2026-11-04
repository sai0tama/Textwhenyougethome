# Wix Deployment Analysis — Street Smart / Street Speak Archive

> **Status:** Investigation only. No application code was changed.
> **Scope:** Determine whether the existing TanStack Start + React 19 + TypeScript app can be deployed through Wix while keeping the current frontend, and how it would communicate with Wix CMS/backend.
> **Research date:** 4 September 2026, against current official Wix documentation (dev.wix.com, Go Headless section).
>
> Related document: [`docs/WIX_INTEGRATION_PLAN.md`](./WIX_INTEGRATION_PLAN.md) (data/API audit — not affected by this analysis).

---

## A. Wix Deployment Options (current, verified against official docs)

Wix Headless offers two development paths ([Choose Your Development Path](https://dev.wix.com/docs/go-headless/get-started/choose-your-development-path)):

### A.1 Wix-Managed Headless (Wix's recommended path)

Wix hosts, deploys, and runs the frontend on Wix infrastructure (global CDN, SSL, deploy previews, auto-scaling). Two sub-paths by framework ([About Supported Frameworks](https://dev.wix.com/docs/go-headless/wix-managed-headless/about-supported-frameworks)):

|                                             | Astro (full integration) | Other frameworks (limited integration)               |
| ------------------------------------------- | ------------------------ | ---------------------------------------------------- |
| Hosting                                     | Wix                      | Wix                                                  |
| Wix builds the project                      | ✓                        | ✗ — _you build locally, Wix serves the build output_ |
| Automatic auth / SEO / secrets / extensions | ✓                        | ✗ — auth is set up yourself                          |
| CLI commands                                | Full set                 | **preview and release only**                         |
| Analytics tracking                          | ✓                        | ✓                                                    |

**What Wix can run for "other frameworks" (quoted from docs):**

> "You can deploy client files, server code, or both:
>
> - **Client files:** A static build, such as a single-page app built with React, Vue, or vanilla HTML and JavaScript.
> - **Server code:** Anything targeting the **Cloudflare Workers runtime**. Deploy a backend on its own, a client and backend side by side, or a full-stack framework that has a **Cloudflare adapter**. **Frameworks whose server output can't run on Cloudflare Workers aren't supported.**"

**Creation routes for other-frameworks projects:**

1. **[Deploy Your Own Frontend with the CLI](https://dev.wix.com/docs/go-headless/wix-managed-headless/other-frameworks/your-own-frontend/deploy-your-own-frontend-with-the-cli)** — initialize from the project root, creating a `wix.config.json` linked to a new Wix Headless project. This is the only route that also allows **server code**. Flow: build locally → `npx wix preview` (shared preview URL) → `npx wix release` (publish). "Releasing doesn't build your project; it uploads your existing build output."
2. **[Upload a Static Site](https://dev.wix.com/docs/go-headless/wix-managed-headless/other-frameworks/your-own-frontend/what-you-can-upload)** (dashboard, no terminal) — **static files only**, no server code. Hard limits: **3 MB per file, 20 MB total**; HTML/CSS/JS/images/fonts/JSON only (video/WASM rejected).
3. **Claude Design** — single HTML page. Not relevant here.

### A.2 Self-Managed Headless

Any framework, any host — including the current host. You connect the frontend to Wix via the JS SDK (`@wix/sdk`) or REST, using a registered **headless client** (OAuth app) with a client ID. This also covers **turning an existing Wix site into the backend** for custom frontends ([About Self-Managed Headless](https://dev.wix.com/docs/go-headless/self-managed-headless/about-self-managed-headless)).

### A.3 Not applicable / out of scope

- **Rebuilding in Wix Studio (Velo editor frontend):** a separate path entirely; not required by any Wix deployment option.
- **Velo HTTP functions on a classic Wix site** (`/pages/_functions`): only available for Wix Studio sites with Velo; a possible _backend supplement_ on the existing site, but not a frontend deployment mechanism.

---

## B. Compatibility with Our Exact Current Stack

### B.1 Our stack (verified in-repo)

- TanStack Start **1.168.32** + TanStack Router **1.170.18** + TanStack Query **5.x**, React **19.2**, TypeScript 5.8, Tailwind v4, Vite 8, Nitro **3.0.260603-beta**.
- Build uses Vite 8 and Nitro configured for preset **`cloudflare-module`**.
- **Verified build output** (`.output/nitro.json`): `"preset": "cloudflare-module"`, server entry `server/index.mjs`, plus a generated `wrangler.json` with `nodeCompat: true`.

### B.2 Point-by-point answers

| #   | Question                                                                       | Answer                                                                                                                                                                                                                                                                                                                                                                     | Evidence                                                                                                                                                                           |
| --- | ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Can TanStack Start SSR be deployed via Wix-managed custom frontend deployment? | **Yes** — via the "other frameworks" path, _provided_ the server build targets the Cloudflare Workers runtime.                                                                                                                                                                                                                                                             | Wix docs: "Anything targeting the Cloudflare Workers runtime… a full-stack framework that has a Cloudflare adapter." TanStack Start documents Nitro Cloudflare deployment presets. |
| 2   | Is our current Nitro SSR output supported?                                     | **Yes, as-is.** Our output is `cloudflare-module` (Workers module format) — exactly the shape Wix runs. It would **not** be supported if built for the Node/`node-server` target.                                                                                                                                                                                          | `.output/nitro.json` shows `cloudflare-module`; `src/server.ts` has the Workers `fetch` signature.                                                                                 |
| 3   | Should we convert to a static SPA/CSR build?                                   | **No — not required.** Static output is _an option_ (via CLI `outputDirectory.client` or dashboard upload), but the upload path is capped at 20 MB total, serves no SSR, and gives up server code + SEO rendering. SPA conversion would be a fallback, not a requirement.                                                                                                  | "What You Can Upload": static only, 3 MB/file, 20 MB total.                                                                                                                        |
| 4   | Can the Wix CLI deploy this existing project while preserving the framework?   | **Yes.** "Deploy a frontend you already have as a Wix-managed headless project, **keeping the web framework you built it with**." For our project type: `npx wix preview`, `npx wix release` (+ global `npx wix login`); `npx wix init` links the repo and creates `wix.config.json`. Wix never builds non-Astro projects — our `npm run build` stays the source of truth. | "Deploy Your Own Frontend with the CLI"; "Build and Deploy with the CLI".                                                                                                          |
| 5   | React 19 / TanStack Query / Radix / Tailwind v4 compatible?                    | **Yes.** These are client-bundled by Vite regardless of host; no Wix-specific constraint affects them.                                                                                                                                                                                                                                                                     | —                                                                                                                                                                                  |

---

## C. Recommended Architecture

**Primary recommendation — Wix-Managed Headless, "other frameworks" (CLI route):**

```
┌─────────────────────────────────────────────────────────────┐
│ Wix Headless Project (new)                                  │
│                                                             │
│  Wix-managed hosting (CDN + SSL)                            │
│   ├─ Client:  .output/public  (Vite static assets)          │
│   └─ Server:  .output/server  (Nitro cloudflare-module SSR) │
│                                                             │
│  Wix CMS (wix-data collections)  ← dashboard-managed        │
│  Wix Media (audio/photo storage) ← via Media Manager APIs   │
│  OAuth headless client (appId in wix.config.json)           │
└─────────────────────────────────────────────────────────────┘
        ▲ npm run build → npx wix preview → npx wix release
```

Rationale:

- It is the **only** option that keeps both SSR and the existing framework with **zero frontend rewrites**.
- Our Nitro `cloudflare-module` output matches Wix's server-code requirement **today, with no config change**.
- The existing `textwhenyougethome.org` Wix site can either (a) later be migrated onto this project, or (b) remain as-is and simply be pointed at the new deployment — see Section E.

**Fallback options if Wix-managed proves blocked in practice:**

- _Fallback 1:_ self-managed headless — deploy the exact same build to Cloudflare Pages/Workers ourselves and attach `@wix/sdk` for data. Same code, different host.
- _Fallback 2:_ static/SPA export (`nitro` static preset or client-only build) uploaded via dashboard — works within 20 MB but loses SSR; keep only if SSR is deemed unnecessary.

---

## D. Required Changes, If Any

**For deployment alone: essentially none to the app code.**

1. **New file only (created by `wix init`, not hand-written):** `wix.config.json` at repo root, pointing Wix at our output:
   - `outputDirectory` should reference the client and server build outputs (`.output/public` and `.output/server`). Default is `./dist`, so this field **must be set** before first release.
   - `appId` (the OAuth client ID Wix generates) is written into it by the CLI.
2. **No routing changes, no UI changes, no component rewrites, no SPA conversion.**
3. **For CMS data integration (the later phase, per `WIX_INTEGRATION_PLAN.md`):**
   - Add `@wix/sdk` (+ `@wix/data`, `@wix/media` as needed) — packages, installed only after approval.
   - Introduce a thin typed data layer (e.g. `src/lib/api/*`) that the components listed in Section C of `WIX_INTEGRATION_PLAN.md` call instead of importing `src/data/*.ts` directly.
   - `clientId`/secrets: client ID is public and may appear in client code; **client secret must only ever be used in server code** (our `src/server.ts` Cloudflare worker is a legitimate place for admin/elevated operations such as approving submissions).

---

## E. Domain / Deployment Implications (`textwhenyougethome.org`)

Verified facts from the docs:

1. **After `npx wix release`, the CLI returns the URL of the published site** — Wix-managed headless projects are served on Wix infrastructure. A custom domain on a headless project is a **premium-plan** feature ("Upgrade to a premium plan to unlock payments, in-depth analytics, custom domains, and more" — About Wix Headless).
2. **Wix-hosted pages** (Wix-implemented login/checkout pages) live on a _separate_ domain — by default a free Wix domain; a custom domain (e.g. a subdomain such as `portal.textwhenyougethome.org`) can be connected via Headless Settings → Manage URLs, and **"You can't connect your external site's domain itself"** to Wix-hosted pages.
3. **Existing site as backend:** the current `textwhenyougethome.org` Wix site does not need to be rebuilt. An existing Wix site can be turned into the backend for the custom frontend by registering a **headless client** in its dashboard (Settings → Development & integrations → Headless Settings). Alternatively, a brand-new Headless project can hold the CMS while the old site stays untouched.

**Implication for us (to confirm in the Wix dashboard at setup time):**

- If the React app replaces the current site at the apex `textwhenyougethome.org`, the domain must be attached to the Wix-managed headless project (premium plan); the exact apex vs. `www` handling and DNS cutover is done in the project dashboard's domain management and must be verified there — the public docs do not spell out apex-domain wiring for Wix-managed frontends, so **do not assume it works identically to classic Wix sites**.
- During transition, the app can deploy to Wix first (free Wix-provided URL) and the domain cutover can happen last, with zero downtime risk to the current site.
- OAuth redirect/allowed-domain settings must list the final domain(s) (dashboard: Allow Redirect Domains / Authorization Redirect URIs).

---

## F. Wix CMS / Backend Integration Approach

**SDK pattern for non-Astro Wix-managed projects** ([Create an SDK Client with OAuth](https://dev.wix.com/docs/go-headless/authentication/setup/create-an-sdk-client-with-oauth)):

```ts
import { createClient, OAuthStrategy } from "@wix/sdk";
import { items as dataItems } from "@wix/data";

export const wixClient = createClient({
  modules: { dataItems },
  auth: OAuthStrategy({ clientId: "<appId from wix.config.json>" }),
});

// Read:  wixClient.dataItems.query("Stories").eq("approved", true).find()
// Write: wixClient.dataItems.insert("StorySubmissions", { ...fields })
```

Key behaviors verified in docs:

- **Visitor tokens are automatic** with the JS SDK on the first call — anonymous visitors can read public collections and submit to intake collections without any login UI. No client secret is needed for visitor/member OAuth.
- **Admin/elevated operations** (approving stories, moderating, deleting) require either the `client_credentials` flow with the **client secret** (must run in backend/server code — our Cloudflare worker qualifies) or an **API key** (self-managed style). Elevation "must run in backend code."
- **Collection permissions** in the Wix dashboard control who can read/write each collection (public read / auth-only write etc.), which is the primary spam-control gate alongside the `approved` workflow fields proposed in `WIX_INTEGRATION_PLAN.md`.
- **SSR + CSR:** the SDK client can be constructed in server code and re-used client-side; TanStack Query remains the cache/fetch layer on top (`queryFn` calls the Wix client).
- **File uploads (audio/photos):** binaries are not stored in wix-data fields; they go to **Wix Media (Media Manager)** via the Media APIs, with the resulting media URL stored in the submission item. Exact current Media upload API surface for headless/external frontends should be confirmed during implementation (the docs' headless section references `@wix/media`; the Astro-specific "upload images to CMS" guide is Astro-integration-specific).

---

## G. Risks

| Risk                                              | Severity           | Detail / Mitigation                                                                                                                                                                                                                                                                                             |
| ------------------------------------------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cloudflare Workers runtime constraints on SSR     | Medium             | The Nitro `cloudflare-module` output runs on Workers, not Node. Node-only APIs would fail at runtime. Current risk is **low**: our SSR is render-only (no server DB calls, no fs), and `wrangler.json` already sets `nodeCompat: true`. Verify with `wrangler dev` / `npx wix preview` before release.          |
| Vite/Nitro build wrapper                          | Low                | Vite config configures Nitro preset `cloudflare-module`. Do not override the preset to a Node target or Wix server hosting breaks.                                                                                                                                                                              |
| Bundle/size limits for Workers & static assets    | Low–Medium         | Docs document 20 MB total only for the _static upload_ path. CLI-deployed client+server size limits are not spelled out publicly — verify after first `npx wix release`.                                                                                                                                        |
| Secret leakage                                    | High if mishandled | The client secret (needed only for admin ops) must never enter the client bundle. Keep all elevated calls in `src/server.ts` (server-side) or Velo backend functions.                                                                                                                                           |
| Custom-domain mechanics for Wix-managed frontends | Medium             | Public docs confirm premium-plan custom domains, but apex-domain wiring for the frontend is dashboard-driven and not fully documented. Plan the DNS cutover carefully; the current site must not go dark during migration.                                                                                      |
| Media upload API surface                          | Medium             | Headless media upload for arbitrary audio formats (webm from Chrome, mp4 from iOS Safari) is not fully documented for non-Astro projects; verify format support and upload endpoints during implementation. Our audio blobs are currently object-URL-only (never persisted) — see `WIX_INTEGRATION_PLAN.md` §E. |
| Auth setup burden (no Astro integration)          | Low                | Limited integration means manual auth wiring (OAuthStrategy + redirect-domain allowlist). Straightforward for our anonymous-visitor use case; matters more if member accounts are ever added.                                                                                                                   |
| Fewer CLI commands                                | Low                | Other-frameworks projects support only `preview`/`release` (no `wix build`, no CI/CD integration, no env-var management). Deploys are always: build locally → release.                                                                                                                                          |
| Nitro beta version                                | Low                | We pin `nitro 3.0.260603-beta`; `cloudflare-module` is the maintained preset, but re-check runtime behavior at first deploy.                                                                                                                                                                                    |

---

---

## H. Exact Implementation Steps After Approval

**Phase 0 — decision (recommended):** Wix-Managed Headless, other-frameworks CLI route. Requires: Wix account login, Node ≥ 20.11.0, no existing `wix.config.json` in repo (✓ we have none).

**Phase 1 — smoke-test deployment (no app changes):**

1. `npx wix login`.
2. `npx wix init` in the repo root → creates the Wix Headless project + `wix.config.json` (CLI-generated; commit it).
3. Edit `wix.config.json`: set `outputDirectory` to the client (`.output/public`) and server (`.output/server`) build outputs instead of the `./dist` default.
4. `npm run build` (unchanged).
5. `npx wix preview` → verify SSR pages render on Wix's preview URL.
6. `npx wix release` → confirm the published URL serves `/`, `/archive`, `/street-smart` correctly.
7. Decide plan: free (Wix-provided URL) vs premium (custom domain / `textwhenyougethome.org` cutover via dashboard).

**Phase 2 — CMS foundation (still no UI changes):** 8. In the project dashboard: create the collections listed in `WIX_INTEGRATION_PLAN.md` §B and set collection permissions (public read for approved content; insert-only for submissions). 9. Register/confirm the headless client; note the `appId`; configure Allow Redirect Domains for the final domain(s).

**Phase 3 — read-path integration (minimal, low-risk first):** 10. Add `@wix/sdk`, `@wix/data` (and `@wix/media` when upload integration starts) — only after approval. 11. Create `src/lib/api/*` typed wrappers; keep `src/data/*.ts` as initial fixtures/fallback. 12. Swap components one at a time, starting with read-only lists: `UpcomingWalks` (events) → `NoteStack` (stories) → `SocialCommunity` → `InteractiveWorldMap` cities → `StoryCounter`. Wrap reads in TanStack Query `queryFn`s; no component markup changes.

**Phase 4 — write-path integration:** 13. Wire `StoryForm` submissions to an insert-only submissions collection (visitor tokens handle auth). 14. Media: upload audio (`AudioRecorder`) and photos (`PhotoSubmission`) to Wix Media; store returned URLs in submission items; verify webm/mp4 support first.

**Phase 5 — moderation & admin:** 15. Implement elevated (admin) operations **server-side only** in `src/server.ts` (or a Velo HTTP function on the existing site) using the client secret / API key; run the approval workflow from the Wix dashboard. 16. Update form copy (currently says nothing is stored) once persistence is real.

**Phase 6 — domain cutover:** connect `textwhenyougethome.org` via the dashboard flow only after everything is verified on the preview URL.

---

## Verdict

| Option                                                                     | Recommendation                                                                        |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| **KEEP CURRENT APP AS-IS** (deploy unchanged via Wix-managed headless)     | **✔ Recommended for deployment**                                                      |
| MINIMALLY ADAPT APP (add `@wix/sdk` + thin data layer at integration time) | **✔ Recommended for the data phase**                                                  |
| REBUILD FRONTEND IN WIX STUDIO                                             | ✗ Rejected — unnecessary; destroys a finished, working frontend for no technical gain |

**Why:** The current TanStack Start build output is _already_ in the one server format Wix-managed headless supports (Cloudflare Workers module), so the app can deploy to Wix with no code changes at all. Nothing in the React/TanStack stack conflicts with Wix hosting. Rebuilding in Wix Studio would discard the completed UI for zero compatibility benefit. The only future code additions are additive: an `@wix/sdk`-based data layer replacing direct imports of `src/data/*.ts`, and server-side secret handling in the existing `src/server.ts` worker. That is "keep as-is" for deployment plus "minimal, additive adaptation" for data — never a rewrite.

---

## Appendix: Deployment Setup Execution Status (4 Sep 2026)

What was executed during the setup session, verified against CLI source code and official docs:

### CLI versions (npm registry, current)

- `@wix/cli` **1.1.242** (current `latest`) — the rewritten sites/apps CLI. For a linked `projectType: "Site"` project it exposes exactly `preview`, `release`, `dev` (+ global `login`, `whoami`). **It has no `init` command** — `wix init` fails with `FailedToIdentifyProgramFlow` when no `wix.config.json` exists.
- `@wix/cli@1.0.x` (last: 1.0.89, Dec 2023) — the original headless CLI with the old `wix init` flow. **Deprecated by npm**: _"Deprecated due to an important fix — preview will not work in this version."_ Do not use.
- `@wix/create-new` **0.0.108** — the current official project-creation entry point ("General entry point for creating Wix projects", engines: node >= 20.11.0). This is what the current docs' "Deploy Your Own Frontend with the CLI" Step 1 uses.

### The official init command for an EXISTING frontend (verified in `@wix/create-new` source)

```
npx @wix/create-new@latest init
```

Top-level `init` — _"Initialize a new Wix project in one step. The command signs you in, creates the project, and saves the generated configuration files locally."_ It operates **in place** on the current folder:

1. Throws `ProjectIsAlreadyLinked` if `wix.config.json` already exists (ours doesn't — safe).
2. Signs in via browser (interactive; requires the user's own terminal).
3. Prompts for a **business name** and creates a **NEW blank Wix Headless project** (blank template id `212b41cb-0da6-4401-9c72-7c579e6477a2`). It does **not** list or touch existing sites — the existing `Textwhenyougethome` site cannot be selected or overwritten by this flow.
4. Writes `wix.config.json` to the current folder (exact content from the `WriteConfig` component):
   ```json
   {
     "projectType": "Site",
     "appId": "<generated OAuth app / client id>",
     "siteId": "<generated headless project id>",
     "site": { "outputDirectory": "./dist" }
   }
   ```

Alternative command `npx @wix/create-new@latest headless link` ("Link current project to use Wix as deployment target") is **Astro-only**: it throws `ProjectIsNotLinkable` unless an `astro.config.{js,cjs,mjs,ts}` file exists in the folder. Our TanStack Start project has none, so `link` is not usable for us; use top-level `init`.

### wix.config.json output paths (required post-init edit)

Our verified Nitro output: `.output/public` (client: assets, `_headers`) and `.output/server` (Workers SSR: `index.mjs`, `wrangler.json`, `nitro.json` preset `cloudflare-module`, `nodeCompat: true`). After init, change the default `./dist` to:

```json
"site": { "outputDirectory": { "client": ".output/public", "server": ".output/server" } }
```

(Exact object shape verified against the CLI's zod schema `wixAstroSiteConfigSchema`: either `client`+optional `server`, or `server`+optional `client`, min length 1.)

### What blocked autonomous completion (by design, not by error)

- `npx -y @wix/cli@latest whoami` → **`LoginRequired`** ("You are not authenticated, log in by running `wix login`"). Browser OAuth cannot be completed from a non-interactive shell.
- Top-level `init` prompts interactively for the business name (no non-interactive flag exists on this subcommand), so it must be run by the user in their own terminal.
- `npx -y @wix/cli@latest preview` (run before init, as a state check) → **`FailedToIdentifyProgramFlow`**: "Project type could not be determined due to a missing configuration file `wix.config.json`" — expected and correct; it confirms the CLI is installed and functioning, and that the project is not yet linked.
- `wix.config.json` was deliberately **not** hand-created with placeholder `appId`/`siteId`: fake values would make the CLI treat the project as linked and fail later with confusing auth/deployment errors. The values must be generated by Wix during `init`.

### Environment verified

- Node **v26.4.0** (>= 20.11.0 required) ✓, npm available, no existing `wix.config.json` ✓.
- Production build re-run after investigation: **pass** (`vite build` exit 0, `.output/` regenerated).
- No application files were created, modified, or removed by this setup session.
