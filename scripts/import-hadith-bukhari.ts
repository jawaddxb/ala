/**
 * ALA Hadith Bukhari Importer
 * Imports Sahih al-Bukhari from downloaded corpus into SQLite database
 */

import * as fs from 'fs';
import * as path from 'path';
import Database from 'better-sqlite3';

const CORPUS_PATH = path.join(__dirname, '../../corpus/hadith/bukhari-processed.json');
const DB_PATH = path.join(__dirname, '../data/ala.db');

interface HadithRecord {
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
  console.log('📚 Starting Sahih al-Bukhari import...\n');

  // Check corpus file exists
  if (!fs.existsSync(CORPUS_PATH)) {
    console.error(`❌ Corpus file not found: ${CORPUS_PATH}`);
    console.log('Please run download-corpus.ts first');
    process.exit(1);
  }

  // Load corpus
  console.log('Loading corpus...');
  const rawData = fs.readFileSync(CORPUS_PATH, 'utf-8');
  const hadiths: HadithRecord[] = JSON.parse(rawData);

  console.log(`Found ${hadiths.length} hadiths\n`);

  // Open database
  const db = new Database(DB_PATH);

  // Prepare insert statement
  const insert = db.prepare(`
    INSERT OR REPLACE INTO sources (id, reference, text, source, book, chapter, verse, number, category)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Process all hadiths
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

  for (const hadith of hadiths) {
    // Clean text
    const cleanText = hadith.text
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) continue;

    records.push({
      id: hadith.id,
      reference: hadith.reference,
      text: cleanText,
      source: 'hadith_bukhari',
      book: 'Sahih al-Bukhari',
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

  console.log('\n✅ Sahih al-Bukhari import complete!');
  console.log(`   Total hadiths: ${records.length.toLocaleString()}`);
}

main();
