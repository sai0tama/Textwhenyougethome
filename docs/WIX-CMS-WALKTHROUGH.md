# Wix CMS Walkthrough & Technical Audit

## Text When You Get Home (Street Speak Archive)

> **Document Status**: Complete Code-Grounded CMS Audit  
> **Repository Context**: `Street Speak Archive (2)`  
> **Audited Modules**: `src/lib/cms/`, `src/server/`, `src/features/`, `src/routes/`  
> **Classification Labels**:
>
> - **[Confirmed in code]**: Traced directly to implementation logic in the local repository.
> - **[Observed in Wix screenshots]**: Visible in provided Wix CMS dashboard screenshots.
> - **[Needs live verification]**: Requires verification against the active Wix backend instance.
> - **[Not implemented]**: Conceptual or planned feature without supporting application code.

---

## 1. Overview of the Wix CMS Architecture

The Text When You Get Home web application is built on **TanStack Start** (React 19, Nitro server engine) integrated with a **Wix Headless CMS** backend via the official `@wix/sdk` (`@wix/data` and `@wix/media`).

### Dual-Client Connection Model [Confirmed in code]

The application uses two distinct Wix clients depending on security privileges and execution context:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        BROWSER / CLIENT-SIDE                           │
│                                                                        │
│  Public Visitor Client: wixClient (OAuthStrategy)                      │
│  - Configured with VITE_WIX_CLIENT_ID                                  │
│  - Generates ephemeral visitor tokens (sessionStorage cache)           │
│  - READ-ONLY access to approved stories, events, posts, articles       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP / RPC
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   SERVER FUNCTIONS (TanStack Start)                    │
│                                                                        │
│  Privileged Server Client: getServerWixClient (ApiKeyStrategy)         │
│  - Configured with WIX_API_KEY + WIX_SITE_ID (Server-Only Secrets)    │
│  - Enforces rate-limiting (10 requests / 15 min per IP)                │
│  - Validates binary magic bytes & MIME types                           │
│  - Generates signed Wix Media upload URLs                              │
│  - INSERTS user submissions with pending / active / new statuses       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Wix REST / SDK
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                          WIX CMS COLLECTIONS                           │
│  ArchiveStories │ Events │ SocialPosts │ BlogPosts │ Media Manager     │
│  AudioSubmissions │ PhotoSubmissions │ NewsletterSubscribers           │
│  HostInquiries                                                         │
└────────────────────────────────────────────────────────────────────────┘
```

1. **Public Visitor Client (`wixClient`)** (`src/lib/cms/wixClient.ts:17-21`):
   - Initialized with `OAuthStrategy({ clientId: VITE_WIX_CLIENT_ID })`.
   - Uses `ensureWixVisitorTokens()` to generate anonymous visitor tokens stored in browser `sessionStorage`.
   - Used for read-only public queries (`ArchiveStories`, `Events`, `SocialPosts`, `BlogPosts`).
   - `useCDN: false` is configured to prevent stale cache returns.

2. **Privileged Server Client (`getServerWixClient()`)** (`src/server/wix/serverClient.ts:37-52`):
   - Initialized with `ApiKeyStrategy({ apiKey: WIX_API_KEY, siteId: WIX_SITE_ID })`.
   - Executes strictly inside server functions (`src/server/functions/*.ts`).
   - Used for privileged write operations (inserting into `ArchiveStories`, `AudioSubmissions`, `PhotoSubmissions`, `NewsletterSubscribers`, `HostInquiries`) and generating signed upload URLs for Wix Media.

---

## 2. Collection Inventory

The application interacts with **8 distinct Wix CMS collections**. Five correspond to the current dashboard collections; three additional collections support newsletter, blog, and walk hosting inquiries.

| Collection Name                            | Direction    | Used By (Feature / Page)                         | Component / Function                    | Purpose                                                                            |
| :----------------------------------------- | :----------- | :----------------------------------------------- | :-------------------------------------- | :--------------------------------------------------------------------------------- |
| **`ArchiveStories`**                       | Read & Write | `/archive`, `/` (Home Map & Counter)             | `archiveQuery.ts`, `submitStory.ts`     | Stores submitted stories; feeds sticky note archive stack and world map.           |
| **`AudioSubmissions`**                     | Write-Only   | `/archive` (Voice Note Recorder)                 | `submitAudio.ts`                        | Intake collection for recorded voice notes and Wix Media audio URLs.               |
| **`PhotoSubmissions`**                     | Write-Only   | `/archive` (Photo Submission)                    | `submitPhoto.ts`                        | Intake collection for submitted photos and Wix Media image URLs.                   |
| **`Events`**                               | Read-Only    | `/street-smart`                                  | `eventsQuery.ts`                        | Manages upcoming walks and previous walk poster gallery (Poster Wall).             |
| **`SocialPosts`** (fallback `socialPosts`) | Read-Only    | `/` (Home Community Rail)                        | `socialQuery.ts`, `SocialCommunity.tsx` | Powers the horizontal drifting Instagram community carousel on Home.               |
| **`NewsletterSubscribers`**                | Read & Write | `/` (Home), `/what-weve-learned`                 | `submitNewsletter.ts`                   | Captures subscriber emails; performs server deduplication before insert.           |
| **`HostInquiries`**                        | Write-Only   | `/street-smart` (Host Section)                   | `submitHostInquiry.ts`                  | Captures emails from visitors offering to host walks in their cities.              |
| **`BlogPosts`**                            | Read-Only    | `/what-weve-learned`, `/what-weve-learned/$slug` | `blogQuery.ts`                          | Field essays, walking audits, and reflective reading notes (has static fallbacks). |

---

## 3. Detailed Field Reference for Each Collection

### 3.1 `ArchiveStories` [Confirmed in code]

- **Collection Key**: `ArchiveStories`
- **Dashboard Visibility**: Present in Wix CMS dashboard screenshots.

| Field Key       | Expected Type     | Required? | Default in Code   | Purpose                                                         | Used By                                    | Example                                                     | Impact on Website                                                                     |
| :-------------- | :---------------- | :-------- | :---------------- | :-------------------------------------------------------------- | :----------------------------------------- | :---------------------------------------------------------- | :------------------------------------------------------------------------------------ |
| `story`         | Text (string)     | **Yes**   | None              | Main narrative content (max 5,000 chars).                       | `NoteStack.tsx`, `StoryBubble.tsx`         | `"I always take the longer route by the bakery because..."` | Displayed as the core text on the sticky note and map bubble.                         |
| `name`          | Text (string)     | No        | `"Anonymous"`     | Display name or alias of storyteller.                           | `NoteStack.tsx`                            | `"Priya"`                                                   | Displayed at top of note. If empty, falls back to "Anonymous".                        |
| `age`           | Number            | No        | `0`               | Age of storyteller.                                             | `NoteStack.tsx`                            | `24`                                                        | Rendered as `", 24"` next to name. If `0`, negative, or omitted, age is hidden.       |
| `city`          | Text (string)     | No        | `""`              | Contributor city/country.                                       | `NoteStack.tsx`, `InteractiveWorldMap.tsx` | `"Bengaluru"`                                               | Shown on note. **Critical**: Matches city pins on the interactive map!                |
| `themeTag`      | Text (string)     | **Yes**   | `"Safety & Care"` | Classification category. Must match one of 6 exact CMS strings. | `archiveQuery.ts`                          | `"Across distance"`                                         | Determines which filter tab displays the note. Must match exact category strings.     |
| `color`         | Text (string)     | No        | `"yellow"`        | Card color theme.                                               | `NoteStack.tsx`, `StickyNote.tsx`          | `"pink"`                                                    | Sets physical card background: `yellow`, `orange`, `pink`, `blue`, `green`, `purple`. |
| `status`        | Text (string)     | **Yes**   | `"pending"`       | Moderation status.                                              | `archiveQuery.ts:116, 213, 250`            | `"approved"`                                                | **Gatekeeper**: ONLY `"approved"` records are visible on the website!                 |
| `showInArchive` | Boolean           | **Yes**   | `false`           | Archive visibility switch.                                      | `archiveQuery.ts:117`                      | `true`                                                      | **Gatekeeper**: Must be `true` for note to appear in the `/archive` stack.            |
| `showOnMap`     | Boolean           | **Yes**   | `false`           | World map visibility switch.                                    | `archiveQuery.ts:214`                      | `true`                                                      | **Gatekeeper**: Must be `true` for note to populate city pins on Home map.            |
| `submittedAt`   | Date / ISO String | No        | Server timestamp  | Submission creation time.                                       | `archiveQuery.ts:215`                      | `"2026-10-15T12:00:00.000Z"`                                | Used to sort map stories (`.descending("submittedAt")`).                              |

> **IMPORTANT**:  
> **Double-Gate for ArchiveStories**: For a story to appear on `/archive`, BOTH `status === "approved"` AND `showInArchive === true` are mandatory. To appear on the world map, BOTH `status === "approved"` AND `showOnMap === true` are mandatory. Setting status to `approved` alone will NOT make it appear if the boolean flags are `false`.

---

### 3.2 `AudioSubmissions` [Confirmed in code]

- **Collection Key**: `AudioSubmissions`
- **Dashboard Visibility**: Present in Wix CMS dashboard screenshots.

| Field Key     | Expected Type       | Required? | Default in Code | Purpose                                                       | Used By              | Example                          | Impact on Website                                                              |
| :------------ | :------------------ | :-------- | :-------------- | :------------------------------------------------------------ | :------------------- | :------------------------------- | :----------------------------------------------------------------------------- |
| `title`       | Text (string)       | No        | Filename        | Submitter description or audio label.                         | `submitAudio.ts:278` | `"Voice note Church St"`         | Label in Wix CMS dashboard. Not rendered on frontend.                          |
| `audioUrl`    | Text / URL (string) | **Yes**   | None            | Wix Media reference URL (`wix:audio://...` or `https://...`). | `submitAudio.ts:279` | `"wix:audio://v1/11062b_...mp3"` | Stores binary location. Allows administrators to listen to recordings in Wix.  |
| `status`      | Text (string)       | No        | `"pending"`     | Moderation / review status.                                   | `submitAudio.ts:280` | `"pending"`                      | Administrative triage in Wix dashboard. Audio is not published on public site. |
| `submittedAt` | Date                | No        | `new Date()`    | Server submission timestamp.                                  | `submitAudio.ts:281` | `2026-10-16T12:00:00Z`           | Allows chronological filtering in Wix CMS.                                     |

---

### 3.3 `PhotoSubmissions` [Confirmed in code]

- **Collection Key**: `PhotoSubmissions`
- **Dashboard Visibility**: Present in Wix CMS dashboard screenshots.

| Field Key     | Expected Type       | Required? | Default in Code | Purpose                                                       | Used By              | Example                          | Impact on Website                                                                |
| :------------ | :------------------ | :-------- | :-------------- | :------------------------------------------------------------ | :------------------- | :------------------------------- | :------------------------------------------------------------------------------- |
| `title`       | Text (string)       | No        | Filename        | Submitter description or photo label.                         | `submitPhoto.ts:255` | `"Corner store Indiranagar"`     | Label in Wix CMS dashboard. Not rendered on frontend.                            |
| `photoUrl`    | Text / URL (string) | **Yes**   | None            | Wix Media reference URL (`wix:image://...` or `https://...`). | `submitPhoto.ts:256` | `"wix:image://v1/11062b_...jpg"` | Stores uploaded image. Allows administrators to view photos in Wix.              |
| `status`      | Text (string)       | No        | `"pending"`     | Moderation / review status.                                   | `submitPhoto.ts:257` | `"pending"`                      | Administrative triage in Wix dashboard. Photos are not published on public site. |
| `submittedAt` | Date                | No        | `new Date()`    | Server submission timestamp.                                  | `submitPhoto.ts:258` | `2026-10-16T12:00:00Z`           | Allows chronological filtering in Wix CMS.                                       |

---

### 3.4 `Events` [Confirmed in code]

- **Collection Key**: `Events`
- **Dashboard Visibility**: Present in Wix CMS dashboard screenshots.

| Field Key                              | Expected Type       | Required?          | Default in Code       | Purpose                                          | Used By                                    | Example                                                            | Impact on Website                                                                       |
| :------------------------------------- | :------------------ | :----------------- | :-------------------- | :----------------------------------------------- | :----------------------------------------- | :----------------------------------------------------------------- | :-------------------------------------------------------------------------------------- |
| `title` (or `title1`)                  | Text (string)       | No                 | `"Street Smart Walk"` | Walk or workshop title.                          | `eventsQuery.ts:44, 131`                   | `"Street Smart Walk #2"`                                           | Rendered on upcoming card and poster wall lightbox.                                     |
| `date`                                 | Date / Time         | **Yes**            | None                  | Scheduled walk date/time.                        | `eventsQuery.ts:20, 97, 118`               | `2026-11-20T18:00:00Z`                                             | Determines upcoming vs past. Formatted as `"20 November"` on site.                      |
| `status`                               | Text (string)       | **Yes**            | None                  | Lifecycle state: `"published"` or `"completed"`. | `eventsQuery.ts:32, 111`                   | `"published"`                                                      | Controls routing to **Upcoming Walks** vs **Poster Wall**. Case-insensitive.            |
| `place` (or `location`)                | Text (string)       | No                 | `""`                  | Meeting point / neighborhood.                    | `eventsQuery.ts:41, 132`                   | `"Indiranagar Metro Station"`                                      | Displayed as location line under Upcoming Walks.                                        |
| `city`                                 | Text (string)       | No                 | `""`                  | Host city name.                                  | `eventsQuery.ts:46, 133`                   | `"Bengaluru"`                                                      | Displayed next to place (e.g. `Indiranagar · Bengaluru`).                               |
| `registrationUrl`                      | Text / URL (string) | No                 | `""`                  | Link to Urbanaut / RSVP ticketing page.          | `eventsQuery.ts:47`                        | `"https://urbanaut.app/spot/..."`                                  | Destination when clicking "Register" on Upcoming Walks.                                 |
| `posterImage` (or `image`, `poster`)   | Image (Wix Media)   | **Yes** (for past) | `""`                  | Visual event poster artwork.                     | `eventsQuery.ts:114, 135`                  | `"wix:image://v1/11062b_...jpg"`                                   | **Mandatory for past events**: Without an image, past walk is omitted from Poster Wall! |
| `caption`                              | Text (string)       | No                 | `${place} · ${city}`  | Poster wall subtitle.                            | `eventsQuery.ts:134`                       | `"Indiranagar · Bengaluru"`                                        | Displayed below title in enlarged poster lightbox.                                      |
| `whatWeLearned` (or `what_we_learned`) | Text / Rich Text    | No                 | `undefined`           | Participant takeaway, quote, or reflection.      | `eventsQuery.ts:137`, `PosterWall.tsx:270` | `"Light helps, but light alone doesn'''t tell you who is around."` | Displayed inside "WHAT WE LEARNED" box in the enlarged poster modal!                    |
| `instagramUrl`                         | Text / URL (string) | No                 | Profile URL           | Instagram recap post link.                       | `eventsQuery.ts:136`                       | `"https://instagram.com/p/..."`                                    | Outbound link from event poster.                                                        |

---

### 3.5 `SocialPosts` (fallback `socialPosts`) [Confirmed in code]

- **Collection Key**: `SocialPosts` (case fallback to `socialPosts`)
- **Dashboard Visibility**: Present in Wix CMS dashboard screenshots.

| Field Key                                        | Expected Type       | Required? | Default in Code | Purpose                    | Used By              | Example                          | Impact on Website                                             |
| :----------------------------------------------- | :------------------ | :-------- | :-------------- | :------------------------- | :------------------- | :------------------------------- | :------------------------------------------------------------ |
| `title` (or `name`, `caption`, `title1`)         | Text (string)       | No        | `""`            | Post headline or quote.    | `socialQuery.ts:77`  | `"Church Street at 9 PM"`        | Displayed on the card beneath the photo.                      |
| `image` (or `postImage`, `photo`, `posterImage`) | Image (Wix Media)   | **Yes**   | `""`            | Post visual / photo asset. | `socialQuery.ts:83`  | `"wix:image://v1/11062b_...jpg"` | Renders in 4:5 aspect ratio on the drifting rail.             |
| `date` (or `publishedDate`, `postDate`)          | Text (string)       | No        | `""`            | Publication date string.   | `socialQuery.ts:94`  | `"12 May 2026"`                  | Displayed as `Instagram · 12 May 2026`.                       |
| `instagramUrl` (or `link`, `url`, `instagram`)   | Text / URL (string) | No        | `""`            | Direct permalink to post.  | `socialQuery.ts:100` | `"https://instagram.com/p/..."`  | Card click destination (`target="_blank"`).                   |
| `status`                                         | Text (string)       | No        | None            | Publication status.        | `socialQuery.ts:51`  | `"published"`                    | Excludes records explicitly set to `"draft"` or `"archived"`. |
| `sortOrder`                                      | Number              | No        | Date order      | Ordering rank integer.     | `socialQuery.ts:57`  | `1, 2, 3...`                     | Controls display sequence from left to right.                 |

---

### 3.6 `NewsletterSubscribers` [Confirmed in code]

- **Collection Key**: `NewsletterSubscribers`
- **Dashboard Visibility**: Created or required for email signups.

| Field Key      | Expected Type     | Required? | Default in Code  | Purpose                                        | Used By                  | Example                      | Impact on Website                                    |
| :------------- | :---------------- | :-------- | :--------------- | :--------------------------------------------- | :----------------------- | :--------------------------- | :--------------------------------------------------- |
| `email`        | Text (string)     | **Yes**   | None             | Subscriber email address (trimmed, lowercase). | `submitNewsletter.ts:88` | `"reader@example.com"`       | Saved to CMS; checked on submit for deduplication.   |
| `status`       | Text (string)     | No        | `"active"`       | Subscription state.                            | `submitNewsletter.ts:90` | `"active"`                   | Allows managing active vs unsubscribed users in Wix. |
| `subscribedAt` | Date / ISO String | No        | Server timestamp | Timestamp of signup.                           | `submitNewsletter.ts:89` | `"2026-10-16T12:00:00.000Z"` | Recorded for subscriber history.                     |

---

### 3.7 `HostInquiries` [Confirmed in code]

- **Collection Key**: `HostInquiries`
- **Dashboard Visibility**: Required for walk host inquiries.

| Field Key     | Expected Type     | Required? | Default in Code  | Purpose                                      | Used By                   | Example                      | Impact on Website                                            |
| :------------ | :---------------- | :-------- | :--------------- | :------------------------------------------- | :------------------------ | :--------------------------- | :----------------------------------------------------------- |
| `email`       | Text (string)     | **Yes**   | None             | Inquirer email address (trimmed, lowercase). | `submitHostInquiry.ts:66` | `"organizer@city.org"`       | Saved to CMS for administrative follow-up.                   |
| `status`      | Text (string)     | No        | `"new"`          | Inquiry workflow status.                     | `submitHostInquiry.ts:68` | `"new"`                      | Allows marking inquiries as `new`, `contacted`, `scheduled`. |
| `submittedAt` | Date / ISO String | No        | Server timestamp | Timestamp of inquiry.                        | `submitHostInquiry.ts:67` | `"2026-10-16T12:00:00.000Z"` | Chronological tracking.                                      |

---

### 3.8 `BlogPosts` [Confirmed in code]

- **Collection Key**: `BlogPosts`
- **Dashboard Visibility**: Optional CMS collection; application features static offline fallback if unconfigured.

| Field Key             | Expected Type     | Required? | Default in Code          | Purpose                             | Used By                 | Example                                       | Impact on Website                                          |
| :-------------------- | :---------------- | :-------- | :----------------------- | :---------------------------------- | :---------------------- | :-------------------------------------------- | :--------------------------------------------------------- |
| `title`               | Text (string)     | **Yes**   | None                     | Article headline.                   | `blogQuery.ts:237`      | `"The chai uncle is safety infrastructure"`   | Title on blog card and article header.                     |
| `slug`                | Text (string)     | **Yes**   | Param derived from title | URL path identifier.                | `blogQuery.ts:240, 340` | `"the-chai-uncle-is-safety-infrastructure"`   | Routes to `/what-weve-learned/$slug`.                      |
| `body` (or `content`) | Text / Rich Text  | **Yes**   | Excerpt fallback         | Full article markdown or rich text. | `blogQuery.ts:244`      | Full article paragraphs                       | Body text on article detail page.                          |
| `excerpt`             | Text (string)     | No        | `""`                     | Brief preview description.          | `blogQuery.ts:243`      | `"We asked people where they feel safest..."` | Shown on blog overview cards.                              |
| `subtitle`            | Text (string)     | No        | `undefined`              | Deck / secondary title.             | `blogQuery.ts:246`      | `"Almost every answer had a person in it."`   | Subtitle below title on detail page.                       |
| `postNumber`          | Text (string)     | No        | `undefined`              | Number badge.                       | `blogQuery.ts:245`      | `"POST 01"`                                   | Shown on card badge.                                       |
| `tryThis`             | Text (string)     | No        | `undefined`              | Reflective community prompt.        | `blogQuery.ts:247`      | `"Notice who would notice you..."`            | Highlighted inside stylized "TRY THIS" box.                |
| `category` (or `tag`) | Text (string)     | No        | `"FIELD NOTES"`          | Article category pill.              | `blogQuery.ts:248`      | `"COMMUNITY WALKS"`                           | Powers category filter pills on `/what-weve-learned`.      |
| `coverImage`          | Image (Wix Media) | No        | `undefined`              | Article hero image.                 | `blogQuery.ts:252`      | `"wix:image://v1/11062b_...jpg"`              | Displayed as card header and article banner.               |
| `readingTime`         | Text (string)     | No        | Auto-calculated          | Reading duration string.            | `blogQuery.ts:253`      | `"2 MIN READ"`                                | Auto-computed from word count if omitted.                  |
| `isPublished`         | Boolean           | No        | `true`                   | Visibility toggle.                  | `blogQuery.ts:254`      | `true`                                        | If `false`, post is excluded from overview and slug route. |
| `status`              | Text (string)     | No        | None                     | Editorial status.                   | `blogQuery.ts:254`      | `"published"`                                 | If set to `"draft"`, post is hidden from the website.      |

---

## 4. Status Values & Their Exact Behavior

### Comparison Matrix across Collections [Confirmed in code]

| Collection                  | Status Value in Wix      | Code Check                                         | Impact on Public Website                                                                                           | Safe to Set Manually?         |
| :-------------------------- | :----------------------- | :------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------- | :---------------------------- |
| **`ArchiveStories`**        | `"pending"`              | Code default on insert                             | **Hidden from public**. Contributor only sees it locally via `localStorage`.                                       | Yes (default state)           |
| **`ArchiveStories`**        | `"approved"`             | Exact string match: `.eq("status", "approved")`    | **Eligible for public display**. Appears on Archive if `showInArchive: true`; appears on Map if `showOnMap: true`. | **Yes (required to publish)** |
| **`ArchiveStories`**        | `"rejected"`             | Not queried                                        | **Permanently hidden** from public site.                                                                           | Yes (safe rejection)          |
| **`ArchiveStories`**        | `"draft"` / Any other    | Not queried                                        | **Hidden**. Any status other than `"approved"` is excluded.                                                        | Yes                           |
| **`Events`**                | `"published"`            | Case-insensitive: `.toLowerCase() === "published"` | Appears under **Upcoming Walks** on `/street-smart` IF `date >= today`.                                            | **Yes (for upcoming walks)**  |
| **`Events`**                | `"completed"`            | Case-insensitive: `.toLowerCase() === "completed"` | Appears on **Poster Wall** on `/street-smart` IF `posterImage` is non-empty. Slices last 4 by date.                | **Yes (for past walks)**      |
| **`Events`**                | `"draft"` / Any other    | Filtered out                                       | **Hidden** from both Upcoming Walks and Poster Wall.                                                               | Yes                           |
| **`SocialPosts`**           | `"published"`            | Case-insensitive active check                      | **Visible** on Home page drifting community carousel.                                                              | **Yes**                       |
| **`SocialPosts`**           | `"draft"` / `"archived"` | Explicitly excluded                                | **Hidden** from Home page community carousel.                                                                      | Yes (safe hide)               |
| **`SocialPosts`**           | Empty / omitted          | Included by default                                | **Visible** (unless explicitly marked draft/archived).                                                             | Yes                           |
| **`AudioSubmissions`**      | `"pending"`              | Code default on insert                             | Stored for administrator review. Not displayed on frontend.                                                        | Yes                           |
| **`AudioSubmissions`**      | Any value                | Not queried by frontend                            | **No frontend effect**. Audio submissions are intake-only.                                                         | Yes                           |
| **`PhotoSubmissions`**      | `"pending"`              | Code default on insert                             | Stored for administrator review. Not displayed on frontend.                                                        | Yes                           |
| **`PhotoSubmissions`**      | Any value                | Not queried by frontend                            | **No frontend effect**. Photo submissions are intake-only.                                                         | Yes                           |
| **`NewsletterSubscribers`** | `"active"`               | Code default on insert                             | Active subscriber record in CMS.                                                                                   | Yes                           |
| **`HostInquiries`**         | `"new"`                  | Code default on insert                             | New host inquiry record in CMS.                                                                                    | Yes                           |
| **`BlogPosts`**             | `"draft"`                | Explicitly excluded                                | **Hidden** from `/what-weve-learned`.                                                                              | Yes                           |

---

## 5. Where Each Collection Appears on the Website

```
HOMEPAGE (/)
 ├── StoryCounter (Approved Story Count) ◄────── ArchiveStories (count where status=approved)
 ├── InteractiveWorldMap (City story popups) ◄─── ArchiveStories (status=approved & showOnMap=true)
 ├── SocialCommunity ("From the social community") ◄─ SocialPosts (status!=draft)
 └── NewsletterSection ("Letters from the pavement") ──► NewsletterSubscribers (insert & dedupe)

ARCHIVE PAGE (/archive)
 ├── NoteStack (Interactive Sticky Note Stack) ◄── ArchiveStories (status=approved & showInArchive=true)
 ├── StoryForm (Submit text story) ───────────────► ArchiveStories (insert status=pending)
 ├── AudioRecorder (Submit voice note) ───────────► AudioSubmissions + Wix Media Manager
 └── PhotoSubmission (Submit photo) ──────────────► PhotoSubmissions + Wix Media Manager

STREET SMART PAGE (/street-smart)
 ├── UpcomingWalks ("Upcoming walks") ◄─────────── Events (status=published & date >= now)
 ├── PosterWall ("Previous event posters") ◄────── Events (status=completed & has posterImage)
 └── HostSection ("Host a Walk") ────────────────► HostInquiries (insert status=new)

WHAT WE'''VE LEARNED PAGE (/what-weve-learned)
 ├── BlogGrid ("Notes from the streets") ◄──────── BlogPosts (status!=draft & isPublished!=false)
 └── ArticleDetailPage (/what-weve-learned/$slug) ◄─ BlogPosts (by slug)
```

---

## 6. Text Story Submission Workflow

1. **User Action**: The visitor fills out the submission card (`StoryForm.tsx`) on the home page or `/archive`.
2. **Client Validation**:
   - `name`: Minimum 2 characters.
   - `age`: 1–3 digits (regex `^\\d{1,3}$`).
   - `city`: Minimum 2 characters.
   - `story`: Minimum 20 characters.
   - `consent`: Must check the agreement box.
3. **Server Submission**: Client calls `submitStoryServerFn` via POST.
4. **Rate Limiting**: Server checks in-memory sliding window (max 10 requests / 15 minutes per IP).
5. **Length Enforcement**: Server limits story to 5,000 characters.
6. **Theme Mapping**: Internal `filterId` mapped to CMS `themeTag`:
   - `safety-care` ➔ `"Safety & Care"`
   - `known-distance` ➔ `"Across distance"`
   - `after-dark` ➔ `"After dark"`
   - `random-incident` ➔ `"A random incident"`
   - `walking-us` ➔ `"Looking out"`
   - `others` ➔ `"Others"`
7. **Database Insert**: Server inserts row into `ArchiveStories` with:
   - `status = "pending"`
   - `showInArchive = false`
   - `showOnMap = false`
   - `submittedAt = new Date().toISOString()`
8. **Local Echo**: The client stores the note in browser `localStorage` (`street_smart_user_notes`). The submitter sees their story immediately in their local session, but **no other visitors** see it until approved in Wix CMS.

---

## 7. Audio Submission Workflow

1. **User Action**: Visitor clicks "Start Recording" in `AudioRecorder.tsx` on `/archive`.
2. **Media Capture**: Real-time microphone capture via browser `MediaRecorder` API (WebM/WAV/MP4). Max 5 minutes client restriction.
3. **Payload Preparation**: Recorded audio Blob is encoded as Base64 string and sent to `submitAudioServerFn`.
4. **Server Validation**:
   - Size limit: 15 MB.
   - Magic Byte Verification: Inspects binary buffer headers:
     - WebM: `1a 45 df a3`
     - WAV: `RIFF` ... `WAVE`
     - OGG: `OggS`
     - MP3: `ID3` or sync bytes `ff e0`
     - MP4/M4A: `ftyp`
5. **Wix Media Storage**:
   - Server requests signed upload URL via `serverClient.files.generateFileUploadUrl`.
   - Server uploads binary to Wix Media signed URL via `fetch(uploadUrl, { method: "POST", body: formData })`.
   - Server polls `serverClient.files.getFileDescriptor(fileId)` until state is `READY` or `OK`.
6. **Database Record**:
   - Server inserts record into `AudioSubmissions` with `title`, `audioUrl` (`wix:audio://...`), `status = "pending"`, and `submittedAt = new Date()`.
   - **Frontend Rendering**: Audio submissions are stored for administrator review and are **not published on the website**.

---

## 8. Photo Submission Workflow

1. **User Action**: Visitor selects or drops an image into `PhotoSubmission.tsx` on `/archive`.
2. **Client Validation**: File type must be `image/*`, file size $\le$ 8 MB.
3. **Server Validation**:
   - Size limit: 8 MB.
   - Magic Byte Verification: Inspects binary buffer headers:
     - JPEG: `ff d8 ff`
     - PNG: `89 50 4e 47 0d 0a 1a 0a`
     - GIF: `GIF87a` or `GIF89a`
     - WebP: `RIFF` ... `WEBP`
4. **Wix Media Storage**:
   - Server requests signed upload URL via `serverClient.files.generateFileUploadUrl`.
   - Server uploads binary to Wix Media signed URL via POST FormData.
   - Server polls descriptor until state is `READY` or `OK`.
5. **Database Record**:
   - Server inserts record into `PhotoSubmissions` with `title`, `photoUrl` (`wix:image://...`), `status = "pending"`, and `submittedAt = new Date()`.
   - **Frontend Rendering**: Photo submissions are stored for administrator review and are **not published on the website**.

---

## 9. Event Management Workflow

### How Upcoming Walks are Selected:

- Query: `wixClient.items.query("Events").ge("date", new Date()).ascending("date").find()`
- Filter: `status.toLowerCase() === "published"`.
- Output: Rendered in chronological order on `/street-smart` under **Upcoming Walks**.
- Clicking "Register" navigates to the event'''s `registrationUrl`.

### How Past Event Posters (Poster Wall) are Selected:

- Query: `wixClient.items.query("Events").ascending("date").find()`
- Filter: `status.toLowerCase() === "completed"` AND has valid non-empty `posterImage`.
- Window: Takes the last 4 completed events (`.slice(-4)`).
- Output: Rendered as interactive drifting posters on `/street-smart`.
- Lightbox: Clicking a poster opens an enlarged view displaying the poster, title, caption, Instagram link, and the **`whatWeLearned`** participant reflection box.

### How an Event Moves from Upcoming to Past:

1. Open the event record in Wix CMS.
2. Change `status` from `published` to `completed`.
3. Upload the event poster artwork to the `posterImage` field.
4. Fill in `whatWeLearned` with a brief participant takeaway quote.
5. Click **Sync to Live** / **Publish**.

---

## 10. Social Post Management Workflow

1. Query: `wixClient.items.query("SocialPosts").find()` (with fallback to `socialPosts`).
2. Active Filter: Excludes any item where `status` is explicitly `draft` or `archived`.
3. Sorting: Sorted by `sortOrder` ascending (`1, 2, 3...`), or by newest date if `sortOrder` is missing.
4. Output: Rendered as a draggable infinite wrapping carousel under **"From the social community"** on the Home page.
5. Cards display the photo in 4:5 aspect ratio, title, date, and link directly to the Instagram post URL.

---

## 11. Newsletter & Article Workflows

### Newsletter Subscriptions:

- Form: `NewsletterSection.tsx` on Home and What We'''ve Learned.
- Server Check: Queries `NewsletterSubscribers` where `email === inputEmail`.
- Deduplication: If email already exists, returns status `"duplicate"` ("You'''re already subscribed to our newsletter.").
- Insert: Creates record in `NewsletterSubscribers` with `status = "active"` and timestamp.

### Blog & Field Articles:

- Overview: `/what-weve-learned` queries `BlogPosts` descending `_createdDate`.
- Detail: `/what-weve-learned/$slug` queries `BlogPosts` where `slug === params.slug`.
- Filtering: Records where `status === "draft"` or `isPublished === false` are hidden.
- Fallback: If Wix CMS `BlogPosts` is unconfigured or empty, the site automatically serves 6 bundled essays (`FALLBACK_BLOG_POSTS`).

---

## 12. Wix Dashboard Step-by-Step Instructions

### Step 1: Navigating to CMS

1. Log in to your Wix Account and open the **Wix Studio / Dashboard** for Text When You Get Home.
2. In the left sidebar, click **CMS** ➔ **Your Collections**.
3. You will see:
   - `ArchiveStories`
   - `AudioSubmissions`
   - `Events`
   - `PhotoSubmissions`
   - `SocialPosts`
   - `NewsletterSubscribers`
   - `HostInquiries`
   - `BlogPosts` (if created)

### Step 2: Moderating a Submitted Text Story

1. Click on **`ArchiveStories`**.
2. Look for records where `status` is `pending`.
3. Read the `story` text to verify it is safe and adheres to community guidelines.
4. Double-click the `status` column and change it from `pending` to:
   ```
   approved
   ```
5. Check the **`showInArchive`** box (`true`).
6. If the story has a recognized city that you want on the world map, check **`showOnMap`** (`true`).
7. Confirm that `themeTag` is one of: `Safety & Care`, `Across distance`, `After dark`, `A random incident`, `Looking out`, `Others`.
8. Click **Sync to Live** / **Publish** in the top right corner.

### Step 3: Publishing a New Upcoming Walk

1. Click on **`Events`** ➔ click **+ Add Item**.
2. Enter:
   - `title`: Walk name (e.g. `Street Smart Walk #4 — Malleshwaram`)
   - `place`: Meeting point (e.g. `CTR Chowdiah Road`)
   - `city`: Host city (e.g. `Bengaluru`)
   - `date`: Future date and time.
   - `status`: `published`
   - `registrationUrl`: Ticketing URL.
3. Click **Sync to Live** / **Publish**.

### Step 4: Archiving a Walk to Poster Wall

1. In **`Events`**, locate the completed walk.
2. Change `status` to `completed`.
3. In `posterImage`, upload or select the poster artwork image.
4. In `whatWeLearned`, enter a participant quote or reflection.
5. In `instagramUrl`, add the recap post link.
6. Click **Sync to Live** / **Publish**.

### Step 5: Updating Social Community Posts

1. Click on **`SocialPosts`**.
2. Click **+ Add Item**.
3. Upload `image` (photo of community/street in 4:5 ratio).
4. Enter `title`, `date`, and `instagramUrl`.
5. Enter `sortOrder` (e.g. `1` for first).
6. Set `status` to `published`.
7. Click **Sync to Live** / **Publish**.

---

## 13. Examples of Safe Content Updates

### Example A: Safe Approved Archive Story

```json
{
  "name": "Ananya",
  "age": 22,
  "city": "Bengaluru",
  "story": "On my walk back from the metro, the flower seller outside the temple is always packing up. We exchange a nod. That small acknowledgement makes the dark stretch feel occupied.",
  "themeTag": "Looking out",
  "color": "pink",
  "status": "approved",
  "showInArchive": true,
  "showOnMap": true
}
```

### Example B: Safe Upcoming Event

```json
{
  "title": "Street Smart Walk #3 — Church Street Night Walk",
  "place": "Blossom Book House, Church Street",
  "city": "Bengaluru",
  "date": "2026-11-28T18:30:00.000Z",
  "status": "published",
  "registrationUrl": "https://urbanaut.app/spot/street-smart-church-st"
}
```

### Example C: Safe Past Event with Poster

```json
{
  "title": "Street Smart Walk #1 — Shivajinagar",
  "place": "Russell Market",
  "city": "Bengaluru",
  "date": "2025-08-15T18:00:00.000Z",
  "status": "completed",
  "posterImage": "wix:image://v1/11062b_...jpg",
  "caption": "Shivajinagar · Bengaluru",
  "whatWeLearned": "The chai uncle who knows your face is safety infrastructure.",
  "instagramUrl": "https://instagram.com/textwhenyougethome"
}
```

---

## 14. Common Errors & Troubleshooting

### Issue 1: "I edited a post or event in Wix CMS, but the website still shows the old content!"

- **Root Cause**: Wix CMS Sandbox vs. Live Content.
- **Explanation**: Edits made in the Wix CMS table edit the Sandbox database. The website queries the Live database.
- **Solution**: In the Wix CMS table, click the **Sync to Live** button or click **Publish** on the Wix site editor.

### Issue 2: "A story marked `approved` does not appear on `/archive`!"

- **Root Cause**: The `showInArchive` column is set to `false` or unchecked.
- **Solution**: Open `ArchiveStories`, find the row, check the box for `showInArchive` (set to `true`), and click **Sync to Live**.

### Issue 3: "A story marked `approved` does not appear on the homepage World Map!"

- **Root Cause**: Either `showOnMap` is `false`, or the `city` name does not match any recognized map city pins.
- **Solution**: Ensure `showOnMap` is `true`, and ensure `city` contains a valid city name (e.g. `Bengaluru`, `Manila`, `Delhi`, `London`).

### Issue 4: "A past event does not appear on the Poster Wall!"

- **Root Cause**: The `posterImage` field is empty, or `status` is not set to `completed`.
- **Solution**: Ensure `status` is `completed` and upload an image into the `posterImage` column.

### Issue 5: "Social Community posts rail shows 'No community posts yet'!"

- **Root Cause**: All items in `SocialPosts` are marked as `draft` or `archived`, or collection ID is misspelled.
- **Solution**: Ensure the collection is named `SocialPosts` (or `socialPosts`) and that items do not have `status: draft`.

---

## 15. Permissions & Security Notes

1. **API Keys Must Remain Server-Side**:
   - `WIX_API_KEY` and `WIX_SITE_ID` are server-only secrets. They must never be prefixed with `VITE_` or imported into client components.
2. **Client Key Restriction**:
   - `VITE_WIX_CLIENT_ID` is a public headless client ID. It is read-only by design.
3. **Wix Media Protection**:
   - Anonymous visitors cannot upload arbitrary binaries directly to Wix Media. All uploads route through server functions that enforce magic byte inspections, file size limits ($\le$ 8 MB for images, $\le$ 15 MB for audio), and IP rate limiting (10 submissions per 15 minutes).

---

## 16. Test Data, Mismatches & Operational Risks

### 16.1 Test Data vs Real User Submissions

1. **Local Storage Test Submissions**:
   - Notes with IDs like `user-1729100000000` live in the submitter's browser `localStorage` (`street_smart_user_notes`). They are stored on the visitor's local machine only and are not saved in Wix CMS. They will not appear on other computers.
2. **Offline Fallback Articles**:
   - The 6 essays on `/what-weve-learned` will display from local bundled fallbacks (`FALLBACK_BLOG_POSTS`) if `BlogPosts` is empty or unconfigured in Wix. This is normal, deliberate offline-first behavior.
3. **Do Not Delete Genuine Submissions**:
   - Records in `AudioSubmissions` and `PhotoSubmissions` are real user audio recordings and photos submitted through the archive form. Do not purge them unless verifying explicit synthetic test submissions.

### 16.2 Inconsistencies, Mismatches & Technical Risks

#### Finding 1: Double-Gate Requirement for Archive Stories

- **Severity**: Medium (Operational Trap)
- **Affected Collection & Fields**: `ArchiveStories` (`status`, `showInArchive`, `showOnMap`)
- **Relevant File & Function**: `src/features/archive/client/archiveQuery.ts` (`fetchArchiveStories`, `fetchStoriesForMap`)
- **Evidence from Code**: Lines 116–117 filter notes by `status === "approved" && Boolean(item.showInArchive)`. Lines 213–214 filter map stories by `status === "approved" && Boolean(item.showOnMap)`.
- **Practical Impact**: If an admin sets `status = "approved"` in the Wix CMS dashboard but forgets to check `showInArchive`, the story remains invisible on `/archive`. If they forget `showOnMap`, it will not appear on the home world map pins.
- **Recommended Corrective Action**: Clearly train dashboard editors to set both `status: approved` AND check `showInArchive: true` and `showOnMap: true`.

#### Finding 2: Wix CMS Sandbox vs. Live Synchronization Lag

- **Severity**: High (User Frustration / Disconnect)
- **Affected Collection & Fields**: All collections (`ArchiveStories`, `Events`, `SocialPosts`, etc.)
- **Relevant File & Function**: `src/lib/cms/wixClient.ts`
- **Evidence from Code**: `wixClient` is configured with `useCDN: false` and connects to the published production headless endpoint. Wix dashboard table edits modify the _Sandbox_ content by default until published/synced.
- **Practical Impact**: Administrators edit records or add events in the Wix dashboard and see their changes in the CMS editor, but the live site does not update until they click **Sync to Live** or **Publish**.
- **Recommended Corrective Action**: Document prominently in editorial workflows that **Sync to Live** is mandatory after every CMS edit.

#### Finding 3: Multi-Key Field Resolution Fallbacks for Events and Social Posts

- **Severity**: Low (Maintenance Fragility)
- **Affected Collection & Fields**: `Events` (`title`/`title1`, `place`/`location`, `posterImage`/`image`), `SocialPosts` (`title`/`name`/`caption`, `image`/`photo`, `instagramUrl`/`link`/`url`)
- **Relevant File & Function**: `src/features/street-smart/client/eventsQuery.ts` (lines 41–48), `src/features/home/client/socialQuery.ts` (lines 75–104)
- **Evidence from Code**: Code employs expansive property chains (`item.title ?? item.name ?? item.caption ?? item.title1`) to compensate for field name discrepancies created across different iterations of Wix CMS setup.
- **Practical Impact**: While resilient, subtle differences in which field holds the preferred value can lead to unexpected display values if both fields are populated in CMS.
- **Recommended Corrective Action**: Standardize on canonical field names in Wix CMS schemas (`title`, `image`, `instagramUrl`, `place`, `city`, `posterImage`, `whatWeLearned`).

#### Finding 4: Audio and Photo Intake Lack Public Rendering Pipelines

- **Severity**: Low (Expectation Mismatch)
- **Affected Collection & Fields**: `AudioSubmissions`, `PhotoSubmissions`
- **Relevant File & Function**: `src/server/functions/submitAudio.ts`, `src/server/functions/submitPhoto.ts`
- **Evidence from Code**: Server functions successfully upload media to Wix Media Manager and insert rows with `status = "pending"`. However, no queries exist in `src/features/` or `src/routes/` that read or render these submissions.
- **Practical Impact**: Non-technical team members may expect submitted voice recordings or photos to eventually appear in the archive stack. Currently, they are stored solely for offline/editorial curation.
- **Recommended Corrective Action**: Clarify in project documentation that Audio and Photo submissions are intake-only pipelines until a dedicated audio player or photo gallery feature is designed and built.

#### Finding 5: TypeScript Index Signature Mismatch in `socialQuery.ts`

- **Severity**: Low (Build Lint Warning)
- **Affected Collection & Fields**: `SocialPosts` (`id`, `_id`)
- **Relevant File & Function**: `src/features/home/client/socialQuery.ts` (line 76, line 102)
- **Evidence from Code**: `npx tsc --noEmit` reports that `item._id` from Wix index signature requires bracket notation `item['_id']` and string type assertion.
- **Practical Impact**: TypeScript strict type checking catches an unindexed property access, though runtime execution falls back safely to `social-${index}`.
- **Recommended Corrective Action**: Cast `item['_id'] as string | undefined` during future planned codebase refactors.

1. **Local Storage Test Submissions**:
   - Notes with IDs like `user-1729100000000` live in the submitter'''s browser `localStorage`. They are not in Wix CMS and will not appear on other computers.
2. **Offline Fallback Articles**:
   - The 6 essays on `/what-weve-learned` will display from code fallbacks if `BlogPosts` is empty in Wix. This is normal and intentional.
3. **Do Not Delete Genuine Submissions**:
   - Records in `AudioSubmissions` and `PhotoSubmissions` are real user uploads. Do not purge them unless verifying test submissions.

---

## 17. Confirmed Facts, Unverified Assumptions & Missing Configuration

| Item                           | Status                      | Verification Detail                                                                            |
| :----------------------------- | :-------------------------- | :--------------------------------------------------------------------------------------------- |
| `ArchiveStories` status gate   | **Confirmed in code**       | Code explicitly checks `status === "approved"` & `showInArchive === true`.                     |
| `Events` upcoming vs past gate | **Confirmed in code**       | Code checks `status === "published"` ($\ge$ today) vs `status === "completed"` (has poster).   |
| `AudioSubmissions` intake-only | **Confirmed in code**       | No read queries exist in frontend codebase.                                                    |
| `PhotoSubmissions` intake-only | **Confirmed in code**       | No read queries exist in frontend codebase.                                                    |
| `NewsletterSubscribers` dedupe | **Confirmed in code**       | Code queries email before inserting.                                                           |
| Production Wix Live Sync state | **Needs live verification** | Requires checking whether the active Wix collection has pending sandbox rows unsynced to Live. |
| `BlogPosts` Wix collection     | **Needs live verification** | Code supports Wix `BlogPosts`; currently serving bundled fallback essays.                      |

---

## 18. Relevant Source Files for Maintenance

- **Wix Visitor Client**: `src/lib/cms/wixClient.ts`
- **Wix Server Client**: `src/server/wix/serverClient.ts`
- **Archive Queries**: `src/features/archive/client/archiveQuery.ts`
- **Story Submission**: `src/server/functions/submitStory.ts`
- **Audio Submission**: `src/server/functions/submitAudio.ts`
- **Photo Submission**: `src/server/functions/submitPhoto.ts`
- **Events Queries**: `src/features/street-smart/client/eventsQuery.ts`
- **Social Posts Query**: `src/features/home/client/socialQuery.ts`
- **Newsletter Server Function**: `src/server/functions/submitNewsletter.ts`
- **Host Inquiry Server Function**: `src/server/functions/submitHostInquiry.ts`
- **Blog Query**: `src/features/what-weve-learned/client/blogQuery.ts`
- **Rate Limiter**: `src/server/security/rateLimiter.ts`
