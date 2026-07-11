# Zion Psalms — Song Browser

A faceted-filtering song browser for the Zion Psalms dataset, embedded as an iframe on [singzion.com](https://www.singzion.com). It pulls data live from a Google Sheet, so the site always reflects the current state of the sheet — no rebuild or redeploy needed when the data changes.

**Live site:** `https://[your-org].github.io/song-browser/`
**Embedded at:** singzion.com (via Google Sites → Insert → Embed → By URL)

---

## How it works

This is a single self-contained file: **`index.html`**. There's no build step, no dependencies to install, and no backend — everything (HTML, CSS, and JavaScript) lives in that one file. To edit it, you can use GitHub's built-in web editor; no local setup required.

### Data source

The app reads from this Google Sheet:

- **Sheet:** `Zion Psalms`
- **Spreadsheet ID:** `1qoApr0hgfl-ts6G8eu9drre69h96zShdOHTVQlwDhuo`
- **Tab (gid):** `518638622`

On every page load, the app fetches the sheet's data using Google's `gviz/tq` endpoint (a public, script-based data feed Google provides for every sheet — this is *not* the same as the "Publish to web" CSV export, which has a CORS restriction that blocks it from loading directly into a webpage). You shouldn't need to touch this unless the underlying spreadsheet is ever replaced or restructured — see [Changing the data source](#changing-the-data-source) below.

**Important:** the sheet must stay shared as **"Anyone with the link can view."** If that permission is ever changed, the app will fail to load data (it'll show a clear on-screen error rather than fail silently).

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
| `Track URI` | Links the track title to its Spotify page |
| `Artist URI(s)` | Links each artist name to their Spotify page (comma-separated, paired positionally with `Artist Name(s)`) |
| `Album URI` | Links the album name to its Spotify page |
| `Psalm No` | Psalm badge + Psalm number search |
| `Genre` | Genre filter (comma-separated values split into multiple tags) |
| `Mood` | Mood slider (0–10 scale) |
| `Congregational` | Congregational slider (0–10 scale) |
| `Textual Variance` | Textual Variance slider (0–10 scale) |
| `Chart` | "Charted songs only" toggle (expects `TRUE` / `FALSE`) |

`Track URI`, `Artist URI(s)`, and `Album URI` are expected in Spotify's native format (e.g. `spotify:track:1cCjXaDbFq6kFQXOdu3KuT`) — this is what Spotify's own export tools (like Exportify) produce by default. If a row is missing one of these, that piece of text just displays as plain, non-clickable text rather than breaking anything.

Rows with an empty `Track Name` are skipped automatically, so blank rows in the sheet won't produce blank cards.

---

## Making changes

### Editing content or data
No code changes needed — just edit the Google Sheet. New rows, updated ratings, corrected typos, etc. all show up automatically the next time someone loads the page (or clicks the **"refresh data"** button in the top right of the app).

### Editing the app itself (design, filters, behavior)
1. Go to the repo on GitHub and open `index.html`
2. Click the pencil icon (✏️) to edit in the browser
3. Make your change
4. Scroll down, add a short commit message describing the change, and commit to `main`
5. GitHub Pages rebuilds automatically within about a minute — hard-refresh the live page (Ctrl/Cmd+Shift+R) to see it, since browsers cache aggressively

For anything more than a small tweak, it's worth pasting the relevant section into an AI assistant (like Claude) along with a description of the change you want — the file is organized with clear CSS and JS sections and inline comments to make this easy.

### Changing the data source
If the Google Sheet is ever replaced, moved, or its tab structure changes, update these two constants near the top of the `<script>` section in `index.html`:

```js
const SPREADSHEET_ID = "1qoApr0hgfl-ts6G8eu9drre69h96zShdOHTVQlwDhuo";
const SHEET_GID = "518638622";
```

- `SPREADSHEET_ID` is the long string in the sheet's normal share URL: `docs.google.com/spreadsheets/d/`**`THIS_PART`**`/edit`
- `SHEET_GID` is the number after `gid=` at the end of the URL when you have the correct tab open

---

## Troubleshooting

**"Couldn't load the sheet" error on page load**
Almost always a sharing-permissions issue. Open the Google Sheet → Share → confirm it's set to "Anyone with the link" → "Viewer."

**Data looks outdated**
Click the **"refresh data"** button in the app, or hard-refresh the browser page. The app doesn't cache data between visits, but browsers sometimes cache the page itself.

**A filter isn't working / a facet is empty**
Check that the corresponding column header in the sheet exactly matches the names listed in [Expected columns](#expected-columns) above — even small differences (extra space, different capitalization) will break the match.

**A track/artist/album isn't clickable**
That row's URI column is either empty or not in Spotify's standard `spotify:track:...` format. The app falls back to plain text rather than showing a broken link, so this degrades gracefully — but if it should link somewhere, check that cell in the sheet.

**Changes to `index.html` aren't showing up live**
Check the repo's **Actions** tab for a "pages build and deployment" run — it should show a green checkmark within a minute or two of your commit. If it's still not showing, try a hard refresh (Ctrl/Cmd+Shift+R).

---

## Credits

Built for Zion Psalms — a living index of songs drawn from the Book of Psalms.
Questions about the data or the ministry: Brandon Buller, King's Cross PCA — brandon@kingscross.life
