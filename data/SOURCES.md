# ALA Scripture Corpus — Source Documentation

> **Integrity verified:** 2026-03-05  
> **Total entries:** 43,211  
> **Files:** `data/seed-*.json` (bundled in repo, loaded on boot)

---

## 1. Quran — `seed-quran.json`

| Field | Value |
|-------|-------|
| **Entries** | 6,236 ayahs |
| **Translation** | Sahih International (English) |
| **Coverage** | All 114 Surahs, complete |
| **Source API** | `https://api.alquran.cloud/v1/quran/en.sahih` |
| **License** | Public domain / free for non-commercial use |
| **ID format** | `quran-{surah}-{ayah}` (e.g. `quran-1-1`) |
| **Reference format** | `{SurahEnglishName} {surah}:{ayah}` (e.g. `Al-Faatiha 1:1`) |
| **Integrity** | ✅ Zero dupes · Zero empty fields · 6,236/6,236 ayahs |

---

## 2. Torah — `seed-torah.json`

| Field | Value |
|-------|-------|
| **Entries** | 5,846 verses |
| **Translation** | Jewish Publication Society / Sefaria (English) |
| **Coverage** | 5 Books of Moses (Pentateuch): Genesis, Exodus, Leviticus, Numbers, Deuteronomy |
| **Source API** | `https://www.sefaria.org/api/texts/{Book}.{chapter}?lang=en&context=0` |
| **License** | Open Content License (Sefaria) — free for non-commercial use |
| **ID format** | `torah-{book_lower}-{chapter}-{verse}` (e.g. `torah-genesis-1-1`) |
| **Reference format** | `{Book} (Torah) {chapter}:{verse}` (e.g. `Genesis (Torah) 1:1`) |
| **Integrity** | ✅ Zero dupes · Zero empty fields · All 5 books complete (50+40+27+36+34 chapters) |
| **Note** | Some verse texts include footnote annotations from Sefaria; HTML tags stripped |

---

## 3. Bible — `seed-bible.json`

| Field | Value |
|-------|-------|
| **Entries** | 31,104 verses |
| **Translation** | Bible in Basic English (BBE) |
| **Coverage** | All 66 books (39 OT + 27 NT), complete |
| **Source** | `github.com/thiagobodruk/bible` — `json/en_bbe.json` |
| **License** | Public domain (BBE published 1949/1964, copyright expired) |
| **ID format** | `bible-{abbrev}-{chapter}-{verse}` (e.g. `bible-gn-1-1`) |
| **Reference format** | `{BookName} {chapter}:{verse}` (e.g. `Genesis 1:1`) |
| **Integrity** | ✅ Zero dupes · Zero empty fields · All 66 books · 31,104/31,104 verses |
| **Note** | BBE uses simplified English vocabulary. Not the same as WEB (World English Bible). |

---

## 4. Secular Wisdom — `seed-secular.json`

| Field | Value |
|-------|-------|
| **Entries** | 25 hand-curated quotes |
| **Coverage** | Marcus Aurelius (Meditations), Epictetus (Enchiridion), Seneca (Letters + De Brevitate), Nietzsche (Zarathustra, BGE, Twilight), Nassim Taleb (Antifragile, Black Swan, SITG), Hayek (Road to Serfdom), Mises (Human Action), Satoshi Nakamoto (Bitcoin Whitepaper), Saifedean Ammous (Bitcoin Standard) |
| **Source** | Hand-curated from primary texts (all public domain or fair use) |
| **License** | Public domain (pre-1928 works) / Fair use (modern quotes used as brief citation) |
| **ID format** | `sec-{author_abbrev}-{n}` (e.g. `sec-ma-1`, `sec-nt-2`) |
| **Reference format** | `{Author}, {Work} {location}` (e.g. `Marcus Aurelius, Meditations 4.3`) |
| **Integrity** | ✅ Zero dupes · Zero empty fields · 25/25 entries |

---

## Integrity Summary

| File | Rows | Dupes | Empty text | Empty ref | Empty ID | Status |
|------|------|-------|-----------|-----------|----------|--------|
| `seed-quran.json` | 6,236 | 0 | 0 | 0 | 0 | ✅ PASS |
| `seed-torah.json` | 5,846 | 0 | 0 | 0 | 0 | ✅ PASS |
| `seed-bible.json` | 31,104 | 0 | 0 | 0 | 0 | ✅ PASS |
| `seed-secular.json` | 25 | 0 | 0 | 0 | 0 | ✅ PASS |
| **TOTAL** | **43,211** | **0** | **0** | **0** | **0** | ✅ **ALL PASS** |

---

## How Seeding Works

`src/lib/db.ts` calls `seedScriptureIfEmpty()` on every server boot:

```typescript
function seedScriptureIfEmpty() {
  const count = db.prepare('SELECT COUNT(*) as c FROM sources').get().c;
  if (count > 0) return; // already seeded — skip
  // loads each seed-*.json and bulk inserts via transaction
}
```

- **Runs in:** < 1 second
- **Trigger:** Every Railway boot (DB is ephemeral SQLite)
- **Idempotent:** Checks row count before inserting, skips if data exists
- **Failure safe:** Missing seed file logs a warning and continues with other sources
