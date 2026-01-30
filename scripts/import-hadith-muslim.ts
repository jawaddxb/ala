/**
 * ALA Hadith Muslim Importer
 * Imports Sahih Muslim from downloaded corpus into SQLite database
 */

import * as fs from 'fs';
import * as path from 'path';
import Database from 'better-sqlite3';

const CORPUS_PATH = path.join(__dirname, '../../corpus/hadith/muslim-processed.json');
const DB_PATH = path.join(__dirname, '../data/ala.db');

interface ProcessedHadith {
  id: string;
  reference: string;
  number: number;
  text: string;
  source: string;
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

function main() {
  console.log('📚 Starting Sahih Muslim import...\n');

  // Check corpus file exists
  if (!fs.existsSync(CORPUS_PATH)) {
    console.error(`❌ Corpus file not found: ${CORPUS_PATH}`);
    console.log('Please run download-corpus.ts first');
    process.exit(1);
  }

  // Load corpus
  console.log('Loading corpus...');
  const rawData = fs.readFileSync(CORPUS_PATH, 'utf-8');
  const allHadiths: ProcessedHadith[] = JSON.parse(rawData);

  console.log(`Found ${allHadiths.length} total hadiths`);

  // Filter hadiths with non-empty text
  const validHadiths = allHadiths.filter(h => h.text && h.text.trim().length > 0);
  console.log(`Valid hadiths with text: ${validHadiths.length}\n`);

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

  for (const hadith of validHadiths) {
    const cleanText = hadith.text
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) continue;

    records.push({
      id: hadith.id,
      reference: hadith.reference,
      text: cleanText,
      source: 'hadith_muslim',
      book: 'Sahih Muslim',
      chapter: null,
      verse: null,
      number: hadith.number,
      category: 'hadith'
    });
  }

  // Insert all records in a transaction
  console.log('Writing to database...');
  insertMany(records);

  db.close();

  console.log('\n✅ Sahih Muslim import complete!');
  console.log(`   Total hadiths: ${records.length.toLocaleString()}`);
}

main();
