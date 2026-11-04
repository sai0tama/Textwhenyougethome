# Wix CMS Quick Reference Guide

## Text When You Get Home (Street Speak Archive)

> **Quick Reference**: Fast lookup cheat sheet for editorial operations and CMS field rules.  
> **Detailed Guide**: See [`docs/WIX-CMS-WALKTHROUGH.md`](./WIX-CMS-WALKTHROUGH.md) for full technical audit, code traces, and deep explanations.

---

## 1. Collections at a Glance

| Collection Name             | Type / Direction | Managed By                          | Where It Appears on Site                              | Primary Status Values                              |
| :-------------------------- | :--------------- | :---------------------------------- | :---------------------------------------------------- | :------------------------------------------------- |
| **`ArchiveStories`**        | Read & Write     | Visitors submit; Admins moderate    | `/archive` (Sticky notes) & `/` (World Map & Counter) | `pending` (hidden) ➔ `approved` (live)             |
| **`Events`**                | Read-Only        | Admins create & manage in Wix       | `/street-smart` (Upcoming Walks & Poster Wall)        | `published` (upcoming) ➔ `completed` (poster wall) |
| **`SocialPosts`**           | Read-Only        | Admins create & manage in Wix       | `/` (Home "From the social community" carousel)       | `published` (or omit draft) ➔ visible              |
| **`AudioSubmissions`**      | Write-Only       | Visitors record on `/archive`       | **Intake Only** (Wix CMS & Media Manager only)        | `pending` (admin review only)                      |
| **`PhotoSubmissions`**      | Write-Only       | Visitors upload on `/archive`       | **Intake Only** (Wix CMS & Media Manager only)        | `pending` (admin review only)                      |
| **`NewsletterSubscribers`** | Read & Write     | Visitors subscribe                  | None (CMS subscriber list)                            | `active`                                           |
| **`HostInquiries`**         | Write-Only       | Visitors offer to host walks        | None (CMS inquiry list for outreach)                  | `new`                                              |
| **`BlogPosts`**             | Read-Only        | Admins manage in Wix (or fallbacks) | `/what-weve-learned` (Field essays & reading notes)   | `published` (visible) vs `draft` (hidden)          |

---

## 2. Essential Fields & Status Cheat Sheet

### `ArchiveStories`

_Visitors submit stories; moderation in Wix determines public visibility._

- **To make a story appear on the website, you MUST set two toggles:**
  1. `status` = `"approved"` _(Exact lowercase string)_
  2. `showInArchive` = `true` _(Checked)_ ➔ Shows note in `/archive` stack.
  3. `showOnMap` = `true` _(Checked)_ ➔ Shows note pin on `/` interactive world map (requires matching `city`).
- **Core Fields**:
  - `story` (Text): Story narrative (required, max 5,000 chars).
  - `name` (Text): Submitter display name (defaults to "Anonymous").
  - `age` (Number): Submitter age (hidden if 0 or blank).
  - `city` (Text): Submitter city (e.g. `Bengaluru`, `Manila`, `London`).
  - `themeTag` (Text): Category tab. Must be one of:
    - `"Safety & Care"`
    - `"Across distance"`
    - `"After dark"`
    - `"A random incident"`
    - `"Looking out"`
    - `"Others"`
  - `color` (Text): Note color (`yellow`, `pink`, `orange`, `blue`, `green`, `purple`).

### `Events`

_Powers both Upcoming Walks and the Historical Poster Wall on `/street-smart`._

- **Upcoming Walks**:
  - `status` = `"published"` _(Case-insensitive)_
  - `date` = Future date/time (`date >= today`)
  - `title`: Walk title (e.g. `Street Smart Walk #4`)
  - `place` & `city`: Meeting spot and city (e.g. `CTR Malleshwaram`, `Bengaluru`)
  - `registrationUrl`: Link to RSVP / ticketing page.
- **Previous Event Posters (Poster Wall)**:
  - `status` = `"completed"` _(Case-insensitive)_
  - `posterImage`: **MANDATORY**. Must have an uploaded poster image (`wix:image://...`). If missing, event is excluded!
  - `whatWeLearned`: Reflection quote shown inside the enlarged poster lightbox modal.
  - `instagramUrl`: Link to recap post on Instagram.

### `SocialPosts` (fallback `socialPosts`)

_Powers the drifting Instagram card carousel under "From the social community" on Home._

- **Visibility**: Included unless `status` is explicitly set to `"draft"` or `"archived"`.
- **Core Fields**:
  - `image`: Photo asset in 4:5 vertical aspect ratio (**Mandatory**).
  - `title`: Short caption or headline beneath photo.
  - `date`: Display date string (e.g. `12 May 2026`).
  - `instagramUrl`: Link directly to Instagram post.
  - `sortOrder`: Integer ranking (`1, 2, 3...`) for left-to-right display sequence.

### `AudioSubmissions` & `PhotoSubmissions`

_Intake-only collections for visitor uploads._

- Uploads are validated server-side by file headers (magic bytes) and stored directly in Wix Media Manager.
- Automatically tagged with `status: "pending"`.
- **Note**: These files are **not** displayed on the public website. They exist for editorial review and archive preservation.

---

## 3. Safe Content-Editing Rules

1. **Always Sync to Live**:
   Wix CMS edits are performed in the **Sandbox** database by default. The website connects to the **Live** database. Always click **Sync to Live** or **Publish** in the Wix dashboard after making edits.
2. **Never Change Collection IDs**:
   Do not rename collection keys (`ArchiveStories`, `Events`, `SocialPosts`, etc.). The code queries exact IDs.
3. **Respect Exact Field Keys**:
   Field keys are case-sensitive in Wix queries (`showInArchive`, `showOnMap`, `themeTag`, `posterImage`, `whatWeLearned`).
4. **Use Exact Theme Strings for Archive Stories**:
   The archive filters use exact match strings (`Safety & Care`, `Across distance`, etc.). A typo will cause the note to be missing from filtered views.
5. **Events Need Both Date and Status**:
   - An event with past date and `status: published` will disappear from Upcoming Walks. To show it on Poster Wall, update its status to `completed` and ensure `posterImage` is uploaded.
6. **Never Expose Sensitive Keys**:
   `WIX_API_KEY` and `WIX_SITE_ID` must remain strictly on the server. Never share or paste them into client code or public tickets.

---

## 4. Top 5 Troubleshooting Scenarios

| Scenario                                          | What Happened                                            | Immediate Fix                                                                    |
| :------------------------------------------------ | :------------------------------------------------------- | :------------------------------------------------------------------------------- |
| **1. CMS edit isn't showing on website**          | Edit is saved in Wix Sandbox, not published to Live.     | Open collection in Wix CMS ➔ Click **Sync to Live** (or Publish site).           |
| **2. Approved story is missing from `/archive`**  | `showInArchive` toggle is false / unchecked.             | In `ArchiveStories`, check `showInArchive` box (`true`) and Sync to Live.        |
| **3. Story is missing from Home World Map**       | `showOnMap` is false, or city is unrecognized.           | Check `showOnMap` box (`true`), ensure `city` matches a map city, and Sync.      |
| **4. Past walk missing from Poster Wall**         | `status` is not `completed`, or `posterImage` is empty.  | Set `status: completed`, upload artwork into `posterImage`, and Sync.            |
| **5. Social rail shows "No community posts yet"** | Items marked `draft`/`archived`, or collection ID wrong. | Ensure collection is `SocialPosts`, set `status: published`, and upload `image`. |
