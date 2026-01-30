/**
 * ALA Torah/Tanakh Importer
 * Downloads and imports Torah from Sefaria API into SQLite database
 */

import * as fs from 'fs';
import * as path from 'path';
import Database from 'better-sqlite3';

const CORPUS_DIR = path.join(__dirname, '../../corpus/torah');
const DB_PATH = path.join(__dirname, '../data/ala.db');

interface SourceRecord {
  id: string;
  reference: string;
  text: string;
  source: string;
  book: string | null;
  chapter: number | null;
  verse: number | null;
  number: number | null;
  category: string | null;
}

// Torah books with Sefaria API names
const TORAH_BOOKS = [
  // Torah (Pentateuch)
  { name: 'Genesis', sefaria: 'Genesis', category: 'torah' },
  { name: 'Exodus', sefaria: 'Exodus', category: 'torah' },
  { name: 'Leviticus', sefaria: 'Leviticus', category: 'torah' },
  { name: 'Numbers', sefaria: 'Numbers', category: 'torah' },
  { name: 'Deuteronomy', sefaria: 'Deuteronomy', category: 'torah' },
  // Nevi'im (Prophets)
  { name: 'Joshua', sefaria: 'Joshua', category: 'neviim' },
  { name: 'Judges', sefaria: 'Judges', category: 'neviim' },
  { name: '1 Samuel', sefaria: 'I Samuel', category: 'neviim' },
  { name: '2 Samuel', sefaria: 'II Samuel', category: 'neviim' },
  { name: '1 Kings', sefaria: 'I Kings', category: 'neviim' },
  { name: '2 Kings', sefaria: 'II Kings', category: 'neviim' },
  { name: 'Isaiah', sefaria: 'Isaiah', category: 'neviim' },
  { name: 'Jeremiah', sefaria: 'Jeremiah', category: 'neviim' },
  { name: 'Ezekiel', sefaria: 'Ezekiel', category: 'neviim' },
  { name: 'Hosea', sefaria: 'Hosea', category: 'neviim' },
  { name: 'Joel', sefaria: 'Joel', category: 'neviim' },
  { name: 'Amos', sefaria: 'Amos', category: 'neviim' },
  { name: 'Obadiah', sefaria: 'Obadiah', category: 'neviim' },
  { name: 'Jonah', sefaria: 'Jonah', category: 'neviim' },
  { name: 'Micah', sefaria: 'Micah', category: 'neviim' },
  { name: 'Nahum', sefaria: 'Nahum', category: 'neviim' },
  { name: 'Habakkuk', sefaria: 'Habakkuk', category: 'neviim' },
  { name: 'Zephaniah', sefaria: 'Zephaniah', category: 'neviim' },
  { name: 'Haggai', sefaria: 'Haggai', category: 'neviim' },
  { name: 'Zechariah', sefaria: 'Zechariah', category: 'neviim' },
  { name: 'Malachi', sefaria: 'Malachi', category: 'neviim' },
  // Ketuvim (Writings)
  { name: 'Psalms', sefaria: 'Psalms', category: 'ketuvim' },
  { name: 'Proverbs', sefaria: 'Proverbs', category: 'ketuvim' },
  { name: 'Job', sefaria: 'Job', category: 'ketuvim' },
  { name: 'Song of Songs', sefaria: 'Song of Songs', category: 'ketuvim' },
  { name: 'Ruth', sefaria: 'Ruth', category: 'ketuvim' },
  { name: 'Lamentations', sefaria: 'Lamentations', category: 'ketuvim' },
  { name: 'Ecclesiastes', sefaria: 'Ecclesiastes', category: 'ketuvim' },
  { name: 'Esther', sefaria: 'Esther', category: 'ketuvim' },
  { name: 'Daniel', sefaria: 'Daniel', category: 'ketuvim' },
  { name: 'Ezra', sefaria: 'Ezra', category: 'ketuvim' },
  { name: 'Nehemiah', sefaria: 'Nehemiah', category: 'ketuvim' },
  { name: '1 Chronicles', sefaria: 'I Chronicles', category: 'ketuvim' },
  { name: '2 Chronicles', sefaria: 'II Chronicles', category: 'ketuvim' },
];

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchBook(sefariaName: string): Promise<{ text: string[][] } | null> {
  const encodedName = encodeURIComponent(sefariaName);
  const url = `https://www.sefaria.org/api/v3/texts/${encodedName}?version=english`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`  Failed to fetch ${sefariaName}: ${response.status}`);
      return null;
    }
    const data = await response.json();
    
    // Extract text from versions array
    if (data.versions && data.versions.length > 0) {
      const englishVersion = data.versions.find((v: any) => v.language === 'en');
      if (englishVersion && englishVersion.text) {
        return { text: englishVersion.text };
      }
    }
    
    return null;
  } catch (error) {
    console.error(`  Error fetching ${sefariaName}:`, error);
    return null;
  }
}

async function downloadCorpus(): Promise<void> {
  console.log('📥 Downloading Torah/Tanakh from Sefaria API...\n');

  // Ensure corpus directory exists
  if (!fs.existsSync(CORPUS_DIR)) {
    fs.mkdirSync(CORPUS_DIR, { recursive: true });
  }

  const allVerses: { 
    book: string; 
    category: string; 
    chapter: number; 
    verse: number; 
    text: string 
  }[] = [];

  for (const bookInfo of TORAH_BOOKS) {
    console.log(`  Fetching ${bookInfo.name}...`);
    const data = await fetchBook(bookInfo.sefaria);
    
    if (!data || !data.text) {
      console.log(`  ⚠️ Skipping ${bookInfo.name} (no data)`);
      continue;
    }

    // Handle nested array structure (chapters -> verses)
    const chapters = data.text;
    
    for (let chapterIdx = 0; chapterIdx < chapters.length; chapterIdx++) {
      const chapter = chapters[chapterIdx];
      if (!Array.isArray(chapter)) continue;
      
      for (let verseIdx = 0; verseIdx < chapter.length; verseIdx++) {
        const verseText = chapter[verseIdx];
        if (!verseText || typeof verseText !== 'string') continue;

        allVerses.push({
          book: bookInfo.name,
          category: bookInfo.category,
          chapter: chapterIdx + 1,
          verse: verseIdx + 1,
          text: verseText.replace(/<[^>]*>/g, '').trim() // Remove HTML tags
        });
      }
    }

    console.log(`  ✓ ${bookInfo.name}: ${chapters.length} chapters`);
    await sleep(300); // Rate limiting - be nice to Sefaria
  }

  // Save corpus
  const outputPath = path.join(CORPUS_DIR, 'tanakh-jps.json');
  fs.writeFileSync(outputPath, JSON.stringify(allVerses, null, 2));
  console.log(`\n✅ Saved ${allVerses.length} verses to ${outputPath}`);
}

async function importToDatabase(): Promise<void> {
  const corpusPath = path.join(CORPUS_DIR, 'tanakh-jps.json');
  
  if (!fs.existsSync(corpusPath)) {
    console.log('Corpus not found, downloading...');
    await downloadCorpus();
  }

  console.log('\n📖 Importing Torah/Tanakh to database...\n');

  const rawData = fs.readFileSync(corpusPath, 'utf-8');
  const verses: { 
    book: string; 
    category: string; 
    chapter: number; 
    verse: number; 
    text: string 
  }[] = JSON.parse(rawData);

  console.log(`Found ${verses.length} verses\n`);

  // Open database
  const db = new Database(DB_PATH);

  // Prepare insert statement
  const insert = db.prepare(`
    INSERT OR REPLACE INTO sources (id, reference, text, source, book, chapter, verse, number, category)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((records: SourceRecord[]) => {
    for (const record of records) {
      insert.run(
        record.id,
        record.reference,
        record.text,
        record.source,
        record.book,
        record.chapter,
        record.verse,
        record.number,
        record.category
      );
    }
  });

  const records: SourceRecord[] = [];
  let torahCount = 0, neviimCount = 0, ketuvimCount = 0;

  for (const verse of verses) {
    const id = `torah_${verse.book.toLowerCase().replace(/\s+/g, '_')}_${verse.chapter}_${verse.verse}`;
    const reference = `${verse.book} ${verse.chapter}:${verse.verse}`;

    records.push({
      id,
      reference,
      text: verse.text,
      source: 'torah',
      book: verse.book,
      chapter: verse.chapter,
      verse: verse.verse,
      number: null,
      category: verse.category
    });

    if (verse.category === 'torah') torahCount++;
    else if (verse.category === 'neviim') neviimCount++;
    else if (verse.category === 'ketuvim') ketuvimCount++;
  }

  console.log('Writing to database...');
  insertMany(records);

  db.close();

  console.log('\n✅ Torah/Tanakh import complete!');
  console.log(`   Total verses: ${records.length.toLocaleString()}`);
  console.log(`   Torah (Pentateuch): ${torahCount.toLocaleString()}`);
  console.log(`   Nevi'im (Prophets): ${neviimCount.toLocaleString()}`);
  console.log(`   Ketuvim (Writings): ${ketuvimCount.toLocaleString()}`);
}

// Main
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--download-only')) {
    await downloadCorpus();
  } else {
    await importToDatabase();
  }
}

main().catch(console.error);
