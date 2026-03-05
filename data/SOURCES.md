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

| File | Rows | Dupes | Empty text | HTML artifacts | Status |
|------|------|-------|-----------|----------------|--------|
| `seed-quran.json` | 6,236 | 0 | 0 | 0 | ✅ PASS |
| `seed-torah.json` | 5,846 | 0 | 0 | 0 | ✅ PASS |
| `seed-bible.json` | 31,104 | 0 | 0 | 0 | ✅ PASS |
| `seed-secular.json` | 25 | 0 | 0 | 0 | ✅ PASS |
| **TOTAL** | **43,211** | **0** | **0** | **0** | ✅ **ALL PASS** |

## Cross-Verification Log

Verified 2026-03-05 against external authoritative sources:

### Quran ✅ All pass
| Verse | Reference | Check |
|-------|-----------|-------|
| Al-Faatiha 1:1 | alquran.cloud | ✅ `In the name of Allah, the Entirely Merciful...` |
| Al-Baqara 2:255 | alquran.cloud | ✅ Ayat al-Kursi — full text verified |
| Al-Baqara 2:256 | alquran.cloud | ✅ `There shall be no compulsion in religion` |
| Ya-Sin 36:1 | alquran.cloud | ✅ `Ya, Seen` |
| Al-Ikhlas 112:1 | alquran.cloud | ✅ `Say, "He is Allah, [who is] One"` |
| An-Naas 114:6 | alquran.cloud | ✅ Last verse of Quran present |

### Torah ✅ All pass (post-cleanup)
**Issue found & fixed:** 1,834 verses contained raw HTML (`<span class="poetry">`, `<br>`, `<small>TERNAL</small>`) from Sefaria's rendering layer. `stripItags=1` does not strip span/br/small. Fixed by re-fetching and applying full HTML strip + small-cap merge (`G<small>OD</small>` → `GOD`).

| Verse | Check |
|-------|-------|
| Genesis 1:1 | ✅ `When God began to create heaven and earth—` |
| Genesis 1:27 | ✅ `created humankind in the divine image` |
| Exodus 20:2 | ✅ `I the ETERNAL am your God who brought you out of Egypt` |
| Exodus 20:3 | ✅ `You shall have no other gods besides Me` |
| Deuteronomy 6:4 | ✅ `Hear, O Israel! The ETERNAL is our God, the ETERNAL alone` |
| Leviticus 19:18 | ✅ `Love your fellow as yourself: I am GOD` (JPS uses "fellow" not "neighbor" — correct) |

### Bible (BBE) ✅ All pass
**Note:** BBE uses simplified English. "neighbour" → "neighbour of yours", "John" → uses abbrev `jo`, "Psalms" → `ps`.

| Verse | Check |
|-------|-------|
| Genesis 1:1 | ✅ `At the first God made the heaven and the earth` |
| John 3:16 | ✅ `God had such love for the world that he gave his only Son` |
| Psalm 23:1 | ✅ `The Lord takes care of me as his sheep` |
| Matthew 5:3 | ✅ `Happy are the poor in spirit` |
| Romans 8:28 | ✅ `all things are working together for good` |
| Revelation 22:21 | ✅ Last verse of Bible present |

### Secular Wisdom ✅ Hand-verified
All 25 quotes verified against primary texts. All pre-1928 (public domain) or brief citations (fair use).

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
