/**
 * ALA Scripture Import Script
 * Imports: Quran, Bible (WEB), Torah (Sefaria), Hadith Bukhari, Hadith Muslim
 * 
 * Run: npx tsx scripts/import-scripture.ts [source]
 * Sources: quran | bible | torah | hadith_bukhari | hadith_muslim | all
 */
import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.resolve(process.cwd(), 'data/ala.db');
const db = new Database(DB_PATH);

// Ensure sources table exists
db.exec(`
  CREATE TABLE IF NOT EXISTS sources (
    id TEXT PRIMARY KEY,
    reference TEXT NOT NULL,
    text TEXT NOT NULL,
    source TEXT NOT NULL,
    book TEXT,
    chapter INTEGER,
    verse INTEGER,
    number INTEGER,
    category TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS idx_sources_source ON sources(source);
`);

const insertSource = db.prepare(`
  INSERT OR REPLACE INTO sources (id, reference, text, source, book, chapter, verse, number, category)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

async function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

// ── QURAN ──────────────────────────────────────────────────────────────────
async function importQuran() {
  console.log('\n📖 Importing Quran (Sahih International)...');
  
  const res = await fetch('https://api.alquran.cloud/v1/quran/en.sahih');
  const data = await res.json();
  
  if (data.code !== 200) throw new Error('Quran API failed');
  
  const surahs = data.data.surahs;
  let count = 0;
  
  const insertMany = db.transaction((verses: Parameters<typeof insertSource['run']>[]) => {
    for (const v of verses) insertSource.run(...v);
  });
  
  const batch: Parameters<typeof insertSource['run']>[] = [];
  
  for (const surah of surahs) {
    for (const ayah of surah.ayahs) {
      const id = `quran-${surah.number}-${ayah.numberInSurah}`;
      const ref = `${surah.englishName} ${surah.number}:${ayah.numberInSurah}`;
      batch.push([id, ref, ayah.text, 'quran', surah.englishName, surah.number, ayah.numberInSurah, ayah.number, 'quran']);
      count++;
    }
  }
  
  insertMany(batch);
  console.log(`  ✓ Imported ${count} ayahs across ${surahs.length} surahs`);
}

// ── BIBLE (World English Bible - public domain) ─────────────────────────────
const BIBLE_BOOKS = [
  { id: 'GEN', name: 'Genesis', chapters: 50 },
  { id: 'EXO', name: 'Exodus', chapters: 40 },
  { id: 'LEV', name: 'Leviticus', chapters: 27 },
  { id: 'NUM', name: 'Numbers', chapters: 36 },
  { id: 'DEU', name: 'Deuteronomy', chapters: 34 },
  { id: 'PSA', name: 'Psalms', chapters: 150 },
  { id: 'PRO', name: 'Proverbs', chapters: 31 },
  { id: 'MAT', name: 'Matthew', chapters: 28 },
  { id: 'MRK', name: 'Mark', chapters: 16 },
  { id: 'LUK', name: 'Luke', chapters: 24 },
  { id: 'JHN', name: 'John', chapters: 21 },
  { id: 'ROM', name: 'Romans', chapters: 16 },
  { id: 'JAS', name: 'James', chapters: 5 },
];

async function importBible() {
  console.log('\n✝️  Importing Bible (World English Bible - key books)...');
  let total = 0;
  
  for (const book of BIBLE_BOOKS) {
    console.log(`  → ${book.name}...`);
    
    for (let ch = 1; ch <= book.chapters; ch++) {
      try {
        const res = await fetch(`https://bible-api.com/${book.name}+${ch}?translation=web`);
        const data = await res.json();
        
        if (!data.verses) { await sleep(500); continue; }
        
        const batch: Parameters<typeof insertSource['run']>[] = [];
        for (const v of data.verses) {
          const id = `bible-${book.id}-${ch}-${v.verse}`;
          const ref = `${book.name} ${ch}:${v.verse}`;
          batch.push([id, ref, v.text.trim(), 'bible', book.name, ch, v.verse, null, 'bible']);
          total++;
        }
        
        const insertMany = db.transaction((verses: Parameters<typeof insertSource['run']>[]) => {
          for (const v of verses) insertSource.run(...v);
        });
        insertMany(batch);
        
        await sleep(150); // rate limit
      } catch (e) {
        console.error(`    Error ${book.name} ${ch}:`, e);
        await sleep(1000);
      }
    }
    console.log(`    ✓ ${book.name} done`);
  }
  
  console.log(`  ✓ Imported ~${total} Bible verses`);
}

// ── TORAH (Sefaria - public domain) ────────────────────────────────────────
const TORAH_BOOKS = [
  { name: 'Genesis', hebrewName: 'Bereishit', chapters: 50 },
  { name: 'Exodus', hebrewName: 'Shemot', chapters: 40 },
  { name: 'Leviticus', hebrewName: 'Vayikra', chapters: 27 },
  { name: 'Numbers', hebrewName: 'Bamidbar', chapters: 36 },
  { name: 'Deuteronomy', hebrewName: 'Devarim', chapters: 34 },
];

async function importTorah() {
  console.log('\n✡️  Importing Torah (Sefaria - 5 Books of Moses)...');
  let total = 0;
  
  for (const book of TORAH_BOOKS) {
    console.log(`  → ${book.name} (${book.hebrewName})...`);
    
    for (let ch = 1; ch <= book.chapters; ch++) {
      try {
        const res = await fetch(`https://www.sefaria.org/api/texts/${book.name}.${ch}?lang=en&context=0`);
        const data = await res.json();
        
        if (!data.text || !Array.isArray(data.text)) { await sleep(300); continue; }
        
        const verses = Array.isArray(data.text[0]) ? data.text.flat() : data.text;
        const batch: Parameters<typeof insertSource['run']>[] = [];
        
        verses.forEach((text: string, idx: number) => {
          if (!text || typeof text !== 'string') return;
          const verseNum = idx + 1;
          const cleanText = text.replace(/<[^>]*>/g, '').trim();
          if (!cleanText) return;
          
          const id = `torah-${book.name.toLowerCase()}-${ch}-${verseNum}`;
          const ref = `${book.name} (Torah) ${ch}:${verseNum}`;
          batch.push([id, ref, cleanText, 'torah', book.name, ch, verseNum, null, 'torah']);
          total++;
        });
        
        const insertMany = db.transaction((verses: Parameters<typeof insertSource['run']>[]) => {
          for (const v of verses) insertSource.run(...v);
        });
        insertMany(batch);
        
        await sleep(200);
      } catch (e) {
        console.error(`    Error ${book.name} ${ch}:`, e);
        await sleep(1000);
      }
    }
    console.log(`    ✓ ${book.name} done`);
  }
  
  console.log(`  ✓ Imported ~${total} Torah verses`);
}

// ── HADITH BUKHARI ─────────────────────────────────────────────────────────
const HADITH_BUKHARI_BOOKS = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25];

async function importHadithBukhari() {
  console.log('\n☪️  Importing Hadith Bukhari...');
  let total = 0;
  
  for (const bookNum of HADITH_BUKHARI_BOOKS) {
    try {
      const res = await fetch(`https://api.hadith.gading.dev/books/bukhari?range=1-50&book=${bookNum}`);
      // Actually this API works differently - use the hadith list endpoint
      await sleep(200);
    } catch (e) { /* skip */ }
  }
  
  // Use a different approach - fetch by range
  console.log('  → Fetching Bukhari hadiths...');
  let hadithNum = 1;
  let consecutiveErrors = 0;
  
  while (hadithNum <= 7563 && consecutiveErrors < 5) {
    const batchSize = 50;
    const end = Math.min(hadithNum + batchSize - 1, 7563);
    
    try {
      const res = await fetch(`https://api.hadith.gading.dev/books/bukhari?range=${hadithNum}-${end}`);
      const data = await res.json();
      
      if (data.code === 200 && data.data?.hadiths) {
        const batch: Parameters<typeof insertSource['run']>[] = [];
        for (const h of data.data.hadiths) {
          const id = `hadith_bukhari-${h.number}`;
          const ref = `Sahih al-Bukhari ${h.number}`;
          const text = h.arab ? `${h.arab}\n\n${h.id || ''}` : (h.id || String(h.number));
          batch.push([id, ref, text, 'hadith_bukhari', 'Bukhari', null, null, h.number, 'hadith']);
          total++;
        }
        const insertMany = db.transaction((items: Parameters<typeof insertSource['run']>[]) => {
          for (const v of items) insertSource.run(...v);
        });
        insertMany(batch);
        consecutiveErrors = 0;
      } else {
        consecutiveErrors++;
      }
    } catch (e) {
      consecutiveErrors++;
      await sleep(1000);
    }
    
    hadithNum += batchSize;
    await sleep(300);
    
    if (hadithNum % 500 === 1) console.log(`  ... ${hadithNum}/${7563}`);
  }
  
  console.log(`  ✓ Imported ~${total} Bukhari hadiths`);
}

// ── HADITH MUSLIM ──────────────────────────────────────────────────────────
async function importHadithMuslim() {
  console.log('\n☪️  Importing Hadith Muslim...');
  let total = 0;
  let hadithNum = 1;
  let consecutiveErrors = 0;
  
  while (hadithNum <= 3033 && consecutiveErrors < 5) {
    const batchSize = 50;
    const end = Math.min(hadithNum + batchSize - 1, 3033);
    
    try {
      const res = await fetch(`https://api.hadith.gading.dev/books/muslim?range=${hadithNum}-${end}`);
      const data = await res.json();
      
      if (data.code === 200 && data.data?.hadiths) {
        const batch: Parameters<typeof insertSource['run']>[] = [];
        for (const h of data.data.hadiths) {
          const id = `hadith_muslim-${h.number}`;
          const ref = `Sahih Muslim ${h.number}`;
          const text = h.arab ? `${h.arab}\n\n${h.id || ''}` : (h.id || String(h.number));
          batch.push([id, ref, text, 'hadith_muslim', 'Muslim', null, null, h.number, 'hadith']);
          total++;
        }
        const insertMany = db.transaction((items: Parameters<typeof insertSource['run']>[]) => {
          for (const v of items) insertSource.run(...v);
        });
        insertMany(batch);
        consecutiveErrors = 0;
      } else {
        consecutiveErrors++;
      }
    } catch (e) {
      consecutiveErrors++;
      await sleep(1000);
    }
    
    hadithNum += batchSize;
    await sleep(300);
    
    if (hadithNum % 500 === 1) console.log(`  ... ${hadithNum}/3033`);
  }
  
  console.log(`  ✓ Imported ~${total} Muslim hadiths`);
}

// ── SECULAR WISDOM ─────────────────────────────────────────────────────────
async function importSecularWisdom() {
  console.log('\n📚 Importing Secular Wisdom (Stoics + key thinkers)...');
  
  const wisdom = [
    // Marcus Aurelius - Meditations
    { id: 'sec-ma-1', ref: 'Marcus Aurelius, Meditations 2.1', text: 'Begin the morning by saying to thyself, I shall meet with the busy-body, the ungrateful, arrogant, deceitful, envious, unsocial.' },
    { id: 'sec-ma-2', ref: 'Marcus Aurelius, Meditations 4.3', text: 'Men seek retreats for themselves, houses in the country, sea-shores, and mountains; and thou too art wont to desire such things very much. But this is altogether a mark of the most common sort of men, for it is in thy power whenever thou shalt choose to retire into thyself.' },
    { id: 'sec-ma-3', ref: 'Marcus Aurelius, Meditations 5.8', text: 'He who has seen present things has seen all, both everything which has taken place from all eternity and everything which will be for time without end.' },
    { id: 'sec-ma-4', ref: 'Marcus Aurelius, Meditations 6.2', text: 'Let it make no difference to thee whether thou art cold or warm, if thou art doing thy duty; and whether thou art drowsy or satisfied with sleep; and whether ill-spoken of or praised; and whether dying or doing something else.' },
    { id: 'sec-ma-5', ref: 'Marcus Aurelius, Meditations 8.7', text: 'Confine yourself to the present.' },
    { id: 'sec-ma-6', ref: 'Marcus Aurelius, Meditations 9.3', text: 'Do not indulge in dreams of having what you have not, but reckon up the chief of the blessings you do possess, and then thankfully remember how eagerly you would have longed for them, if they had not been yours.' },
    { id: 'sec-ma-7', ref: 'Marcus Aurelius, Meditations 10.1', text: 'Wilt thou then never cease to be moulded by others, until thou hast no longer any principle peculiar to thyself, but art in everything guided by the reason of those who surround thee?' },
    // Epictetus - Enchiridion
    { id: 'sec-ep-1', ref: 'Epictetus, Enchiridion 1', text: 'Of things some are in our power, and others are not. In our power are opinion, movement towards a thing, desire, aversion; and in a word, whatever are our own acts. Not in our power are the body, property, reputation, offices of power, and in a word, whatever are not our own acts.' },
    { id: 'sec-ep-2', ref: 'Epictetus, Enchiridion 5', text: 'Men are disturbed not by the things which happen, but by the opinions about the things: for example, death is nothing terrible, for if it were, it would have seemed so to Socrates; for the opinion about death, that it is terrible, is the terrible thing.' },
    { id: 'sec-ep-3', ref: 'Epictetus, Enchiridion 8', text: 'Ask not that the things which happen should happen as you wish; but wish the things which happen to be as they are, and you will have a tranquil flow of life.' },
    { id: 'sec-ep-4', ref: 'Epictetus, Enchiridion 14', text: 'If you intend to improve, throw away such thoughts as these: if I neglect my affairs, I shall not have the means of living; unless I chastise my slave, he will be bad. For it is better to die in famine and be free from grief and fear, than to live in affluence with perturbation.' },
    { id: 'sec-ep-5', ref: 'Epictetus, Enchiridion 17', text: 'Remember that thou art an actor in a play, the character of which is determined by the author: if short, a short one; if long, a long one.' },
    // Seneca
    { id: 'sec-sen-1', ref: 'Seneca, Letters 1', text: 'Ita fac, mi Lucili: vindica te tibi. (Do this, my dear Lucilius: lay claim to yourself for yourself.)' },
    { id: 'sec-sen-2', ref: 'Seneca, On the Shortness of Life', text: 'Omnia, Lucili, aliena sunt, tempus tantum nostrum est. (Everything, Lucilius, belongs to others; time alone is ours.)' },
    { id: 'sec-sen-3', ref: 'Seneca, Letters 77', text: 'Recede in te ipse quantum potes. (Retire into yourself as much as you can.)' },
    // Nietzsche
    { id: 'sec-fn-1', ref: 'Nietzsche, Thus Spoke Zarathustra', text: 'Man must surpass himself. What is great in man is that he is a bridge and not an end.' },
    { id: 'sec-fn-2', ref: 'Nietzsche, Beyond Good and Evil', text: 'He who has a why to live can bear almost any how.' },
    { id: 'sec-fn-3', ref: 'Nietzsche, Twilight of the Idols', text: 'What does not kill me makes me stronger.' },
    // Nassim Taleb
    { id: 'sec-nt-1', ref: 'Taleb, Antifragile', text: 'Wind extinguishes a candle and energizes fire. Likewise with randomness, uncertainty, chaos: you want to use them, not hide from them.' },
    { id: 'sec-nt-2', ref: 'Taleb, The Black Swan', text: 'The inability to predict outliers implies the inability to predict the course of history.' },
    { id: 'sec-nt-3', ref: 'Taleb, Skin in the Game', text: 'If you have the rewards, you must also get some of the risks, not let others pay the price of your mistakes.' },
    // Hayek / Mises (for Kiyan's economic worldview)
    { id: 'sec-hay-1', ref: 'Hayek, The Road to Serfdom', text: 'The curious task of economics is to demonstrate to men how little they really know about what they imagine they can design.' },
    { id: 'sec-mis-1', ref: 'Mises, Human Action', text: 'The market is not a place, a thing, or a collective entity. The market is a process, actuated by the interplay of the actions of the various individuals cooperating under the division of labor.' },
    // Bitcoin/Sound Money
    { id: 'sec-sat-1', ref: 'Satoshi Nakamoto, Bitcoin Whitepaper (2008)', text: 'What is needed is an electronic payment system based on cryptographic proof instead of trust, allowing any two willing parties to transact directly with each other without the need for a trusted third party.' },
    { id: 'sec-sai-1', ref: 'Saifedean Ammous, The Bitcoin Standard', text: 'Bitcoin is the first example of a new form of life. It lives and breathes on the internet. It lives because it can pay people to keep it alive.' },
  ];
  
  const insertMany = db.transaction((items: typeof wisdom) => {
    for (const w of items) {
      insertSource.run(w.id, w.ref, w.text, 'secular', 'Secular Wisdom', null, null, null, 'secular');
    }
  });
  insertMany(wisdom);
  
  console.log(`  ✓ Imported ${wisdom.length} secular wisdom entries`);
}

// ── MAIN ───────────────────────────────────────────────────────────────────
async function main() {
  const arg = process.argv[2] || 'all';
  console.log(`\n🔤 ALA Scripture Import — source: ${arg}\n`);
  
  const start = Date.now();
  
  try {
    if (arg === 'quran' || arg === 'all') await importQuran();
    if (arg === 'torah' || arg === 'all') await importTorah();
    if (arg === 'bible' || arg === 'all') await importBible();
    if (arg === 'hadith_bukhari' || arg === 'all') await importHadithBukhari();
    if (arg === 'hadith_muslim' || arg === 'all') await importHadithMuslim();
    if (arg === 'secular' || arg === 'all') await importSecularWisdom();
    
    const total = (db.prepare('SELECT COUNT(*) as c FROM sources').get() as {c: number}).c;
    const elapsed = ((Date.now() - start) / 1000 / 60).toFixed(1);
    
    console.log(`\n✅ Done in ${elapsed}min. Total sources in DB: ${total.toLocaleString()}\n`);
  } catch (e) {
    console.error('Import failed:', e);
    process.exit(1);
  } finally {
    db.close();
  }
}

main();
