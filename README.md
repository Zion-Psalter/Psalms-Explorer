# Zion Psalms — Psalms Explorer

A faceted-filtering song explorer for the Zion Psalms dataset, embedded as an iframe on [singzion.com](https://www.singzion.com). Song data comes from a Google Sheet, synced hourly into a static file the app reads — so it stays fast at any catalog size, while the Sheet stays the actual editing surface (see [Data source](#data-source) below for why).

**Live site:** `(https://zion-psalter.github.io/Psalms-Explorer/)`
**Embedded at:** singzion.com (via Google Sites → Insert → Embed → By URL)

---

## Features (current: v2.1)

- **Faceted filtering** — free-text search, Psalm number, Genre (multi-select), Mood / Congregational / Textual Variance dual-handle sliders (each label has a hover tooltip explaining what it means), a "Charted songs only" toggle, an "Exclude unrated songs" toggle, and — once signed in — a "My Favorites" toggle. Any combination can be cleared at once.
- **Sorting** — by Psalm number, artist, release date, or track length, ascending or descending, from the dropdown in the header.
- **Live song count** — the number in the header always reflects how many songs match your *current* filters, not a static total.
- **30-second audio preview** — play/pause button on each card (when the sheet has a preview URL); starting one stops whatever was already playing.
- **Spotify deep links** — track, artist, and album names link out to their Spotify pages whenever the sheet has a URI for them.
- **Psalm passage preview on hover** — hovering a song's Psalm badge shows a live tooltip preview of that Psalm's text (via RefTagger), and clicking it opens the full chapter on `biblia.com` in a new tab.
- **Per-song "⋮" menu** — click the dots on a card to flip it and reveal: a "Read Psalm N" link (ESV.org), Lyrics, Chord chart, and CCLI info links (each only shown if the sheet has that URL), and "Rate this song."
- **Google sign-in & Favorites** — "Sign in with Google" in the header (via Firebase Auth). Once signed in, a heart toggle appears on every card; favorites are saved to that Google account (via Firestore), so they follow the same visitor across devices and browsers. "My Favorites" filters to just those songs and shows a live `(#)` count of how many are saved.
- **Export Favorites to CSV** — with "My Favorites" on, an action bar appears above the results with a button that downloads a CSV of every favorited song: Psalm No, Track Name, Artist Name, Album Name, Chord Chart URL, Lyrics URL, CCLI URL. The name and URL columns are clickable links (via Excel/Google Sheets' `=HYPERLINK()` formula) straight to Spotify, the chord chart, lyrics, or CCLI SongSelect.
- **"Rate this song"** — opens a pre-filled evaluation form (Fillout) for that specific track.

---

## How it works

The app itself is a single self-contained file: **`index.html`**. There's no build step, no dependencies to install, and no backend — all its HTML, CSS, and JavaScript lives in that one file, and it renders whatever's in **`data.json`**, which sits right alongside it. To edit `index.html`, you can use GitHub's built-in web editor; no local setup required.

### Data source

The song catalog itself still lives in this Google Sheet — that part hasn't changed, and it's still where you add/edit songs:

- **Sheet:** `Zion Psalms`
- **Spreadsheet ID:** `1qoApr0hgfl-ts6G8eu9drre69h96zShdOHTVQlwDhuo`
- **Tab (gid):** `518638622`

What *has* changed: `index.html` no longer talks to the Sheet directly. A scheduled GitHub Action (**`.github/workflows/sync-sheet.yml`**, running **`scripts/sync-sheet.mjs`**) fetches the Sheet **once an hour**, trims it down to just the columns the app uses, and commits the result to **`data.json`** in this repo. The app just does a plain `fetch('./data.json')` on load — a static file GitHub Pages already serves efficiently, versus querying the Sheet live on every single visit.

Why bother with the extra layer: the Sheet is genuinely great as an editing surface (bulk edits, familiar spreadsheet UI, pasting straight from Spotify export tools) but was never designed to be a public data API — Google's `gviz/tq` endpoint used for that is an unofficial, legacy mechanism, and it made the live-fetched payload the single biggest cost on the page (over 1MB and growing with every song added), with none of the caching a plain static file gets for free.

**Practical effect: data changes take up to an hour to show up on the live site**, not instantly. To force it sooner, go to the repo's **Actions** tab → "Sync sheet data" → **Run workflow**.

**Important:** the sheet must stay shared as **"Anyone with the link can view"** — the sync job reads it the same way the app used to, with no special credentials. If that permission is ever changed, the next sync will fail (check the **Actions** tab for a red X) rather than silently going stale.

### Sign-in & Favorites (Firebase)

"Sign in with Google" and Favorites are powered by [Firebase](https://console.firebase.google.com) (project: `zion-psalms`), using:

- **Authentication** — Google sign-in via a popup (Firebase Auth).
- **Cloud Firestore** — one document per signed-in user, in the `favorites` collection, keyed by that user's Firebase UID. Each document has a single `trackUris` array field holding the Spotify Track URIs they've favorited.

The Firebase project config (API key, project ID, etc.) is hardcoded near the top of the main `<script>` block in `index.html`. This is normal for Firebase's client-side SDK — that config isn't a secret, access is actually controlled by Firestore's security rules and the authorized-domains list below — so there's no need to hide or rotate it.

**Important:** sign-in only works from domains listed in Firebase Console → **Authentication → Settings → Authorized domains**. If this app is ever embedded on a new domain, or the GitHub Pages URL changes, add it there or "Sign in with Google" will silently fail (it also won't work from `localhost` unless you add that too, which is why testing sign-in locally needs its own authorized-domain entry).

### Expected columns

The app expects these exact column headers in the sheet. If a column is renamed, the app won't be able to find it:

| Column | Used for |
|---|---|
| `Track Name` | Card title |
| `Artist Name(s)` | Card subtitle |
| `Album Name` | Card metadata line |
| `Album Release Date` | Year shown on card |
| `Album Image URL` | Card artwork |
| `Track Duration (ms)` | Duration shown on card |
| `Track Preview URL` | 30-second audio preview button |
| `Track URI` | Links the track title to its Spotify page; also the key used to identify a song as a Favorite and to link it in the "Export Favorites to CSV" download |
| `Artist URI(s)` | Links each artist name to their Spotify page (comma-separated, paired positionally with `Artist Name(s)`) |
| `Album URI` | Links the album name to its Spotify page |
| `Psalm No` | Psalm badge, Psalm number search, the badge's hover preview of the passage, and the "Read Psalm" link in the ⋮ menu |
| `Genre` | Genre filter (comma-separated values split into multiple tags) |
| `Mood` | Mood slider (0–10 scale) |
| `Congregational` | Congregational slider (0–10 scale) |
| `Textual Variance` | Textual Variance slider (0–10 scale) |
| `Chart` | "Charted songs only" toggle and the "Chart" tag (expects `TRUE` / `FALSE`) — an indicator only, doesn't need to point anywhere itself |
| `Lyrics URL` | "Lyrics" link in the ⋮ menu (row omitted if blank) |
| `Chord Chart URL` | "Chord chart" link in the ⋮ menu (row omitted if blank) |
| `CCLI URL` | "CCLI" badge on the card plus the "CCLI info" link in the ⋮ menu (both omitted if blank) |

`Track URI`, `Artist URI(s)`, and `Album URI` are expected in Spotify's native format (e.g. `spotify:track:1cCjXaDbFq6kFQXOdu3KuT`) — this is what Spotify's own export tools (like Exportify) produce by default. If a row is missing one of these, that piece of text just displays as plain, non-clickable text rather than breaking anything.

Rows with an empty `Track Name` are skipped automatically, so blank rows in the sheet won't produce blank cards.

---

## Making changes

### Editing content or data
No code changes needed — just edit the Google Sheet. New rows, updated ratings, corrected typos, etc. show up on the live site within an hour (the next scheduled sync), or immediately if you trigger the "Sync sheet data" workflow manually from the **Actions** tab.

### Editing the app itself (design, filters, behavior)
1. Go to the repo on GitHub and open `index.html`
2. Click the pencil icon (✏️) to edit in the browser
3. Make your change
4. Scroll down, add a short commit message describing the change, and commit to `main`
5. GitHub Pages rebuilds automatically within about a minute — hard-refresh the live page (Ctrl/Cmd+Shift+R) to see it, since browsers cache aggressively

For anything more than a small tweak, it's worth pasting the relevant section into an AI assistant (like Claude) along with a description of the change you want — the file is organized with clear CSS and JS sections and inline comments to make this easy.

### Changing the data source
If the Google Sheet is ever replaced, moved, or its tab structure changes, update these two constants near the top of **`scripts/sync-sheet.mjs`** (not `index.html` — the sync script is the only thing that talks to the Sheet now):

```js
const SPREADSHEET_ID = "1qoApr0hgfl-ts6G8eu9drre69h96zShdOHTVQlwDhuo";
const SHEET_GID = "518638622";
```

- `SPREADSHEET_ID` is the long string in the sheet's normal share URL: `docs.google.com/spreadsheets/d/`**`THIS_PART`**`/edit`
- `SHEET_GID` is the number after `gid=` at the end of the URL when you have the correct tab open

### Rearranging columns in the sheet is safe

`scripts/sync-sheet.mjs` matches columns by their **header text** (`USED_COLUMNS`), not by position — so freely reordering, or inserting new columns anywhere in the sheet, won't break anything. The only thing that matters is that the header text for a column the app uses (see [Expected columns](#expected-columns) below) isn't renamed to something different — if it is, that field just goes blank in `data.json` on the next sync, the same graceful-degradation behavior as before.

---

## Troubleshooting

**"Couldn't load the sheet" error on page load**
The app couldn't fetch `data.json` at all (as opposed to it just being stale) — most likely `data.json` doesn't exist yet (e.g. the very first sync hasn't run), or the last sync run failed. Check the repo's **Actions** tab for the "Sync sheet data" workflow's most recent run; a red X there usually means the underlying Google Sheet fetch failed, most often a sharing-permissions issue — confirm the Sheet is still set to "Anyone with the link" → "Viewer."

**Data looks outdated**
This is expected for up to an hour — see [Data source](#data-source) above. Check the **Actions** tab to see when "Sync sheet data" last ran successfully, or trigger it manually ("Run workflow") for an immediate update. If the sync itself is up to date but the *site* still looks stale, hard-refresh the browser page (Ctrl/Cmd+Shift+R) — that's a normal browser-cache issue, not a data one.

**A filter isn't working / a facet is empty**
Check that the corresponding column header in the sheet exactly matches the names listed in [Expected columns](#expected-columns) above — even small differences (extra space, different capitalization) will break the match. Also confirm the last sync succeeded (Actions tab) — a renamed column just means that field is blank until the header text matches again, not an error.

**A track/artist/album isn't clickable**
That row's URI column is either empty or not in Spotify's standard `spotify:track:...` format. The app falls back to plain text rather than showing a broken link, so this degrades gracefully — but if it should link somewhere, check that cell in the sheet.

**Changes to `index.html` aren't showing up live**
Check the repo's **Actions** tab for a "pages build and deployment" run — it should show a green checkmark within a minute or two of your commit. If it's still not showing, try a hard refresh (Ctrl/Cmd+Shift+R).

**"Sign in with Google" does nothing, or the popup fails**
The current domain likely isn't in Firebase's authorized-domains list — see [Sign-in & Favorites (Firebase)](#sign-in--favorites-firebase) above. This is also expected when testing from `localhost` unless that's been added too. Popups blocked by the browser (common inside an iframe embed) will also cause a silent failure.

**"Couldn't save that favorite" when clicking a heart**
Usually a dropped connection, or a Firestore security-rules issue if this ever happens for every user rather than one flaky click. The heart updates immediately either way — if the save fails, it visually reverts a moment later rather than leaving the UI out of sync with what's actually stored.

---

## Credits

Built for Zion Psalms — a living index of songs drawn from the Book of Psalms.
Questions about the data or the ministry: Brandon Buller, King's Cross PCA — brandon@kingscross.life
