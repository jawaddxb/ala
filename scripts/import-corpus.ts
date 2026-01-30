#!/usr/bin/env npx tsx
/**
 * ALA Corpus Import Script
 * Imports Quran, Bible, Hadith, and Secular wisdom into the database
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = path.join(process.cwd(), 'data', 'ala.db');
const db = new Database(dbPath);

interface Source {
  id: string;
  reference: string;
  text: string;
  source: string;
  book?: string;
  chapter?: number;
  verse?: number;
  number?: number;
  category?: string;
}

// Bulk insert with transaction
function bulkInsert(sources: Source[]) {
  const insert = db.prepare(`
    INSERT OR REPLACE INTO sources (id, reference, text, source, book, chapter, verse, number, category)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const transaction = db.transaction((sources: Source[]) => {
    for (const s of sources) {
      insert.run(s.id, s.reference, s.text, s.source, s.book || null, s.chapter || null, s.verse || null, s.number || null, s.category || null);
    }
  });
  
  transaction(sources);
  return sources.length;
}

// Import Quran (all 6236 verses)
async function importQuran() {
  console.log('📖 Importing Quran...');
  const sources: Source[] = [];
  
  try {
    // Fetch full Quran from AlQuran.cloud API
    const response = await fetch('https://api.alquran.cloud/v1/quran/en.sahih');
    const data = await response.json();
    
    if (data.code !== 200) throw new Error('Failed to fetch Quran');
    
    for (const surah of data.data.surahs) {
      for (const ayah of surah.ayahs) {
        sources.push({
          id: `quran_${surah.number}_${ayah.numberInSurah}`,
          reference: `Quran ${surah.number}:${ayah.numberInSurah} (${surah.englishName})`,
          text: ayah.text,
          source: 'quran',
          book: surah.englishName,
          chapter: surah.number,
          verse: ayah.numberInSurah,
        });
      }
    }
    
    const count = bulkInsert(sources);
    console.log(`  ✅ Imported ${count} Quran verses`);
    return count;
  } catch (error) {
    console.error('  ❌ Error importing Quran:', error);
    return 0;
  }
}

// Import Bible (Proverbs, Psalms, Ecclesiastes, Matthew, John, Romans)
async function importBible() {
  console.log('📖 Importing Bible...');
  const sources: Source[] = [];
  
  // Key books for wisdom/spirituality
  const books = [
    { name: 'Proverbs', chapters: 31 },
    { name: 'Psalms', chapters: 150 },
    { name: 'Ecclesiastes', chapters: 12 },
    { name: 'Matthew', chapters: 28 },
    { name: 'John', chapters: 21 },
    { name: 'Romans', chapters: 16 },
    { name: 'James', chapters: 5 },
    { name: '1Corinthians', chapters: 16 },
  ];
  
  try {
    for (const book of books) {
      console.log(`  📚 Fetching ${book.name}...`);
      for (let chapter = 1; chapter <= book.chapters; chapter++) {
        try {
          const response = await fetch(`https://bible-api.com/${book.name}+${chapter}`);
          const data = await response.json();
          
          if (data.verses) {
            for (const verse of data.verses) {
              sources.push({
                id: `bible_${book.name.toLowerCase()}_${chapter}_${verse.verse}`,
                reference: `${book.name} ${chapter}:${verse.verse}`,
                text: verse.text.trim(),
                source: 'bible',
                book: book.name,
                chapter: chapter,
                verse: verse.verse,
              });
            }
          }
          // Small delay to avoid rate limiting
          await new Promise(r => setTimeout(r, 100));
        } catch (e) {
          // Skip failed chapters
        }
      }
    }
    
    const count = bulkInsert(sources);
    console.log(`  ✅ Imported ${count} Bible verses`);
    return count;
  } catch (error) {
    console.error('  ❌ Error importing Bible:', error);
    return 0;
  }
}

// Import Hadith Bukhari
async function importHadithBukhari() {
  console.log('📖 Importing Hadith Bukhari...');
  const sources: Source[] = [];
  
  try {
    // Fetch from sunnah.com API (first 500 hadiths)
    for (let i = 1; i <= 50; i++) {
      try {
        const response = await fetch(`https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/eng-bukhari/${i}.json`);
        const data = await response.json();
        
        if (data.hadiths) {
          for (const hadith of data.hadiths) {
            sources.push({
              id: `bukhari_${hadith.hadithnumber}`,
              reference: `Sahih al-Bukhari ${hadith.hadithnumber}`,
              text: hadith.text,
              source: 'hadith_bukhari',
              book: `Book ${i}`,
              number: hadith.hadithnumber,
            });
          }
        }
      } catch (e) {
        // Skip failed books
      }
    }
    
    const count = bulkInsert(sources);
    console.log(`  ✅ Imported ${count} Bukhari hadiths`);
    return count;
  } catch (error) {
    console.error('  ❌ Error importing Bukhari:', error);
    return 0;
  }
}

// Import Hadith Muslim
async function importHadithMuslim() {
  console.log('📖 Importing Hadith Muslim...');
  const sources: Source[] = [];
  
  try {
    // Fetch from hadith API
    for (let i = 1; i <= 43; i++) {
      try {
        const response = await fetch(`https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/eng-muslim/${i}.json`);
        const data = await response.json();
        
        if (data.hadiths) {
          for (const hadith of data.hadiths) {
            sources.push({
              id: `muslim_${hadith.hadithnumber}`,
              reference: `Sahih Muslim ${hadith.hadithnumber}`,
              text: hadith.text,
              source: 'hadith_muslim',
              book: `Book ${i}`,
              number: hadith.hadithnumber,
            });
          }
        }
      } catch (e) {
        // Skip failed books
      }
    }
    
    const count = bulkInsert(sources);
    console.log(`  ✅ Imported ${count} Muslim hadiths`);
    return count;
  } catch (error) {
    console.error('  ❌ Error importing Muslim:', error);
    return 0;
  }
}

// Import secular wisdom quotes
async function importSecularWisdom() {
  console.log('📖 Importing Secular Wisdom...');
  
  // Classic wisdom from various traditions
  const wisdomQuotes: Source[] = [
    // Greek Philosophy
    { id: 'secular_socrates_1', reference: 'Socrates', text: 'The only true wisdom is in knowing you know nothing.', source: 'secular', category: 'Greek Philosophy' },
    { id: 'secular_socrates_2', reference: 'Socrates', text: 'An unexamined life is not worth living.', source: 'secular', category: 'Greek Philosophy' },
    { id: 'secular_plato_1', reference: 'Plato', text: 'Be kind, for everyone you meet is fighting a hard battle.', source: 'secular', category: 'Greek Philosophy' },
    { id: 'secular_plato_2', reference: 'Plato', text: 'The measure of a man is what he does with power.', source: 'secular', category: 'Greek Philosophy' },
    { id: 'secular_aristotle_1', reference: 'Aristotle', text: 'We are what we repeatedly do. Excellence, then, is not an act, but a habit.', source: 'secular', category: 'Greek Philosophy' },
    { id: 'secular_aristotle_2', reference: 'Aristotle', text: 'It is the mark of an educated mind to be able to entertain a thought without accepting it.', source: 'secular', category: 'Greek Philosophy' },
    { id: 'secular_epictetus_1', reference: 'Epictetus', text: 'It is not things that disturb us, but our judgments about things.', source: 'secular', category: 'Stoicism' },
    { id: 'secular_marcus_1', reference: 'Marcus Aurelius', text: 'The happiness of your life depends upon the quality of your thoughts.', source: 'secular', category: 'Stoicism' },
    { id: 'secular_marcus_2', reference: 'Marcus Aurelius', text: 'Waste no more time arguing about what a good man should be. Be one.', source: 'secular', category: 'Stoicism' },
    { id: 'secular_seneca_1', reference: 'Seneca', text: 'We suffer more in imagination than in reality.', source: 'secular', category: 'Stoicism' },
    { id: 'secular_seneca_2', reference: 'Seneca', text: 'Luck is what happens when preparation meets opportunity.', source: 'secular', category: 'Stoicism' },
    
    // Eastern Philosophy
    { id: 'secular_confucius_1', reference: 'Confucius', text: 'It does not matter how slowly you go as long as you do not stop.', source: 'secular', category: 'Confucianism' },
    { id: 'secular_confucius_2', reference: 'Confucius', text: 'The man who moves a mountain begins by carrying away small stones.', source: 'secular', category: 'Confucianism' },
    { id: 'secular_confucius_3', reference: 'Confucius', text: 'Before you embark on a journey of revenge, dig two graves.', source: 'secular', category: 'Confucianism' },
    { id: 'secular_laozi_1', reference: 'Lao Tzu', text: 'The journey of a thousand miles begins with a single step.', source: 'secular', category: 'Taoism' },
    { id: 'secular_laozi_2', reference: 'Lao Tzu', text: 'When I let go of what I am, I become what I might be.', source: 'secular', category: 'Taoism' },
    { id: 'secular_laozi_3', reference: 'Lao Tzu', text: 'Nature does not hurry, yet everything is accomplished.', source: 'secular', category: 'Taoism' },
    { id: 'secular_buddha_1', reference: 'Buddha', text: 'Three things cannot be long hidden: the sun, the moon, and the truth.', source: 'secular', category: 'Buddhism' },
    { id: 'secular_buddha_2', reference: 'Buddha', text: 'Holding on to anger is like drinking poison and expecting the other person to die.', source: 'secular', category: 'Buddhism' },
    { id: 'secular_buddha_3', reference: 'Buddha', text: 'Peace comes from within. Do not seek it without.', source: 'secular', category: 'Buddhism' },
    
    // Rumi
    { id: 'secular_rumi_1', reference: 'Rumi', text: 'The wound is the place where the Light enters you.', source: 'secular', category: 'Sufi Poetry' },
    { id: 'secular_rumi_2', reference: 'Rumi', text: 'What you seek is seeking you.', source: 'secular', category: 'Sufi Poetry' },
    { id: 'secular_rumi_3', reference: 'Rumi', text: 'Yesterday I was clever, so I wanted to change the world. Today I am wise, so I am changing myself.', source: 'secular', category: 'Sufi Poetry' },
    { id: 'secular_rumi_4', reference: 'Rumi', text: 'Be like a tree and let the dead leaves drop.', source: 'secular', category: 'Sufi Poetry' },
    { id: 'secular_rumi_5', reference: 'Rumi', text: 'Silence is the language of God, all else is poor translation.', source: 'secular', category: 'Sufi Poetry' },
    
    // Modern Philosophy
    { id: 'secular_gandhi_1', reference: 'Mahatma Gandhi', text: 'Be the change you wish to see in the world.', source: 'secular', category: 'Modern' },
    { id: 'secular_gandhi_2', reference: 'Mahatma Gandhi', text: 'An eye for an eye only ends up making the whole world blind.', source: 'secular', category: 'Modern' },
    { id: 'secular_mlk_1', reference: 'Martin Luther King Jr.', text: 'Darkness cannot drive out darkness; only light can do that. Hate cannot drive out hate; only love can do that.', source: 'secular', category: 'Modern' },
    { id: 'secular_mlk_2', reference: 'Martin Luther King Jr.', text: 'The time is always right to do what is right.', source: 'secular', category: 'Modern' },
    { id: 'secular_frankl_1', reference: 'Viktor Frankl', text: 'When we are no longer able to change a situation, we are challenged to change ourselves.', source: 'secular', category: 'Modern' },
    { id: 'secular_frankl_2', reference: 'Viktor Frankl', text: 'Those who have a \'why\' to live, can bear with almost any \'how\'.', source: 'secular', category: 'Modern' },
    
    // Kahlil Gibran
    { id: 'secular_gibran_1', reference: 'Kahlil Gibran', text: 'Your pain is the breaking of the shell that encloses your understanding.', source: 'secular', category: 'Poetry' },
    { id: 'secular_gibran_2', reference: 'Kahlil Gibran', text: 'Out of suffering have emerged the strongest souls; the most massive characters are seared with scars.', source: 'secular', category: 'Poetry' },
    
    // Various Proverbs
    { id: 'secular_proverb_1', reference: 'African Proverb', text: 'If you want to go fast, go alone. If you want to go far, go together.', source: 'secular', category: 'Proverbs' },
    { id: 'secular_proverb_2', reference: 'Japanese Proverb', text: 'Fall seven times, stand up eight.', source: 'secular', category: 'Proverbs' },
    { id: 'secular_proverb_3', reference: 'Chinese Proverb', text: 'The best time to plant a tree was 20 years ago. The second best time is now.', source: 'secular', category: 'Proverbs' },
    { id: 'secular_proverb_4', reference: 'Native American Proverb', text: 'We do not inherit the earth from our ancestors; we borrow it from our children.', source: 'secular', category: 'Proverbs' },
    { id: 'secular_proverb_5', reference: 'Persian Proverb', text: 'This too shall pass.', source: 'secular', category: 'Proverbs' },
  ];
  
  const count = bulkInsert(wisdomQuotes);
  console.log(`  ✅ Imported ${count} secular wisdom quotes`);
  return count;
}

// Main execution
async function main() {
  console.log('🚀 Starting ALA Corpus Import\n');
  
  const stats = {
    quran: 0,
    bible: 0,
    bukhari: 0,
    muslim: 0,
    secular: 0,
  };
  
  stats.quran = await importQuran();
  stats.bible = await importBible();
  stats.bukhari = await importHadithBukhari();
  stats.muslim = await importHadithMuslim();
  stats.secular = await importSecularWisdom();
  
  console.log('\n📊 Import Summary:');
  console.log(`   Quran: ${stats.quran}`);
  console.log(`   Bible: ${stats.bible}`);
  console.log(`   Hadith Bukhari: ${stats.bukhari}`);
  console.log(`   Hadith Muslim: ${stats.muslim}`);
  console.log(`   Secular Wisdom: ${stats.secular}`);
  console.log(`   ────────────────`);
  console.log(`   Total: ${Object.values(stats).reduce((a, b) => a + b, 0)}`);
}

main().catch(console.error);
