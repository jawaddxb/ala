/**
 * ALA Bible Importer
 * Imports KJV Bible from downloaded corpus into SQLite database
 */

import * as fs from 'fs';
import * as path from 'path';
import Database from 'better-sqlite3';

const CORPUS_PATH = path.join(__dirname, '../../corpus/bible/bible-kjv.json');
const DB_PATH = path.join(__dirname, '../data/ala.db');

interface BibleBook {
  abbrev: string;
  name: string;
  chapters: string[][];
}

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

// Define Old Testament books for categorization
const OLD_TESTAMENT_BOOKS = new Set([
  'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy',
  'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel', '1 Kings', '2 Kings',
  '1 Chronicles', '2 Chronicles', 'Ezra', 'Nehemiah', 'Esther',
  'Job', 'Psalms', 'Proverbs', 'Ecclesiastes', 'Song of Solomon',
  'Isaiah', 'Jeremiah', 'Lamentations', 'Ezekiel', 'Daniel',
  'Hosea', 'Joel', 'Amos', 'Obadiah', 'Jonah', 'Micah', 'Nahum',
  'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah', 'Malachi'
]);

function main() {
  console.log('📖 Starting Bible import...\n');

  // Check corpus file exists
  if (!fs.existsSync(CORPUS_PATH)) {
    console.error(`❌ Corpus file not found: ${CORPUS_PATH}`);
    console.log('Please run download-corpus.ts first');
    process.exit(1);
  }

  // Load corpus
  console.log('Loading corpus...');
  const rawData = fs.readFileSync(CORPUS_PATH, 'utf-8');
  const bibleBooks: BibleBook[] = JSON.parse(rawData);

  console.log(`Found ${bibleBooks.length} books\n`);

  // Open database
  const db = new Database(DB_PATH);

  // Prepare insert statement
  const insert = db.prepare(`
    INSERT OR REPLACE INTO sources (id, reference, text, source, book, chapter, verse, number, category)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Process all books
  let totalVerses = 0;
  let otVerses = 0;
  let ntVerses = 0;

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

  for (const book of bibleBooks) {
    const bookName = book.name;
    const testament = OLD_TESTAMENT_BOOKS.has(bookName) ? 'old_testament' : 'new_testament';

    for (let chapterIdx = 0; chapterIdx < book.chapters.length; chapterIdx++) {
      const chapter = book.chapters[chapterIdx];
      const chapterNum = chapterIdx + 1;

      for (let verseIdx = 0; verseIdx < chapter.length; verseIdx++) {
        const verseText = chapter[verseIdx];
        const verseNum = verseIdx + 1;

        // Clean text - remove KJV annotations like {words} and «notes»
        const cleanText = verseText
          .replace(/\{[^}]*\}/g, '') // Remove {annotations}
          .replace(/«[^»]*»/g, '')   // Remove «notes»
          .replace(/\s+/g, ' ')       // Normalize whitespace
          .trim();

        if (!cleanText) continue;

        const id = `bible_${bookName.toLowerCase().replace(/\s+/g, '_')}_${chapterNum}_${verseNum}`;
        const reference = `${bookName} ${chapterNum}:${verseNum}`;

        records.push({
          id,
          reference,
          text: cleanText,
          source: 'bible',
          book: bookName,
          chapter: chapterNum,
          verse: verseNum,
          number: null,
          category: testament
        });

        totalVerses++;
        if (testament === 'old_testament') otVerses++;
        else ntVerses++;
      }
    }

    console.log(`  ✓ ${bookName}: ${book.chapters.length} chapters`);
  }

  // Insert all records in a transaction
  console.log('\nWriting to database...');
  insertMany(records);

  db.close();

  console.log('\n✅ Bible import complete!');
  console.log(`   Total verses: ${totalVerses.toLocaleString()}`);
  console.log(`   Old Testament: ${otVerses.toLocaleString()}`);
  console.log(`   New Testament: ${ntVerses.toLocaleString()}`);
}

main();
