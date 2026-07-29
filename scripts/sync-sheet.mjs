// Pulls the Zion Psalms Google Sheet and writes it to data.json at the repo
// root. Run on a schedule by .github/workflows/sync-sheet.yml.
//
// data.json is {columns:[...], rows:[[...], ...]} rather than an array of
// {"Track Name": "...", ...} objects — repeating all 19 column names on
// every one of ~1,300 rows was most of the file's weight. index.html
// reconstructs the row objects client-side (a few lines, negligible CPU)
// after fetching, so the rest of the app is unaffected by this shape.
//
// If the Google Sheet is ever replaced, moved, or its tab changes, update
// these two constants (see README.md > Changing the data source).
const SPREADSHEET_ID = "1qoApr0hgfl-ts6G8eu9drre69h96zShdOHTVQlwDhuo";
const SHEET_GID = "518638622";
const GVIZ_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?gid=${SHEET_GID}&headers=1`;

// Only columns index.html actually reads end up in data.json — matched by
// label (header text), not column position, so the sheet's columns can be
// freely reordered or have others added without breaking this.
const USED_COLUMNS = [
  "Psalm No", "Track Name", "Artist Name(s)", "Album Name",
  "Album Release Date", "Album Image URL", "Track Duration (ms)",
  "Track Preview URL", "Track URI", "Artist URI(s)", "Album URI",
  "Genre", "Mood", "Congregational", "Textual Variance", "Chart",
  "Chord Chart URL", "Lyrics URL", "CCLI URL",
];

// Mirrors gvizDateToString() that used to live in index.html: gviz encodes
// dates as literal strings like "Date(2023,0,15)" (month is 0-indexed).
function gvizDateToString(v) {
  const m = /^Date\(([^)]+)\)$/.exec(v);
  if (!m) return v;
  const parts = m[1].split(",").map((n) => parseInt(n.trim(), 10));
  const [y, mo, d] = parts;
  const dt = new Date(y, mo || 0, d || 1);
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${dt.getFullYear()}-${mm}-${dd}`;
}

async function main() {
  const res = await fetch(GVIZ_URL);
  if (!res.ok) throw new Error(`Sheet fetch failed: HTTP ${res.status} ${res.statusText}`);
  const text = await res.text();

  const match = /setResponse\(([\s\S]*)\);?\s*$/.exec(text.trim());
  if (!match) throw new Error("Unexpected response format from Google Sheets (not a gviz setResponse payload).");
  const json = JSON.parse(match[1]);
  if (json.status === "error") {
    const msg = json.errors && json.errors[0] && json.errors[0].detailed_message;
    throw new Error(`Google Sheets returned an error: ${msg || "unknown"}`);
  }

  const labels = json.table.cols.map((c) => (c.label || c.id || "").trim());
  // Index of each USED_COLUMNS entry within the sheet's actual columns, in
  // USED_COLUMNS' order — this is what makes column position in the sheet
  // irrelevant; only the header text has to match.
  const colIndexes = USED_COLUMNS.map((label) => labels.indexOf(label));
  const nameIdx = USED_COLUMNS.indexOf("Track Name");

  const rows = json.table.rows
    .map((row) => {
      const cells = row.c || [];
      return colIndexes.map((i) => {
        if (i === -1) return "";
        const cell = cells[i] || null;
        if (!cell || cell.v === null || cell.v === undefined) return "";
        return typeof cell.v === "string" ? gvizDateToString(cell.v) : String(cell.v);
      });
    })
    .filter((r) => (r[nameIdx] || "").trim() !== "");

  const fs = await import("node:fs/promises");
  await fs.writeFile("data.json", JSON.stringify({ columns: USED_COLUMNS, rows }), "utf8");
  console.log(`Wrote data.json with ${rows.length} rows.`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
