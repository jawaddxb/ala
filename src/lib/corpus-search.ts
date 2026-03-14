/**
 * ALA Corpus Search
 * BM25-based search for religious texts
 * No embeddings needed - works great on CPU
 */

// @ts-ignore - wink packages have type issues
import bm25 from 'wink-bm25-text-search';
// @ts-ignore
import nlp from 'wink-nlp';
// @ts-ignore
import model from 'wink-eng-lite-web-model';

import quranData from '@/data/corpus/quran.json';
import bukhariData from '@/data/corpus/hadith-bukhari.json';
import muslimData from '@/data/corpus/hadith-muslim.json';
import bibleData from '@/data/corpus/bible.json';
import torahData from '@/data/corpus/torah.json';
import secularData from '@/data/corpus/secular.json';
import salahGuideData from '@/data/corpus/salah-guide.json';

// Surah name aliases for Arabic → chapter number normalization
// Enables queries like "Surat Al-Ahzab verse 72" to match "Quran 33:72"
const SURAH_ALIASES: Record<string, number> = {
  'fatiha': 1, 'fatihah': 1, 'opening': 1,
  'baqara': 2, 'baqarah': 2, 'cow': 2,
  'imran': 3, 'ali-imran': 3,
  'nisa': 4, 'nisaa': 4, 'women': 4,
  'maida': 5, 'maidah': 5, 'table': 5,
  'anam': 6, 'anaam': 6, 'cattle': 6,
  'araf': 7, 'araaf': 7, 'heights': 7,
  'anfal': 8, 'anfaal': 8, 'spoils': 8,
  'tawba': 9, 'tawbah': 9, 'taubah': 9, 'repentance': 9,
  'yunus': 10, 'jonah': 10,
  'hud': 11, 'hood': 11,
  'yusuf': 12, 'joseph': 12,
  'rad': 13, 'raad': 13, 'thunder': 13,
  'ibrahim': 14, 'abraham': 14,
  'hijr': 15,
  'nahl': 16, 'bee': 16,
  'isra': 17, 'israa': 17, 'bani israel': 17,
  'kahf': 18, 'cave': 18,
  'maryam': 19, 'mary': 19,
  'taha': 20, 'ta-ha': 20,
  'anbiya': 21, 'anbiyaa': 21, 'prophets': 21,
  'hajj': 22, 'pilgrimage': 22,
  'muminun': 23, 'muminoon': 23, 'believers': 23,
  'nur': 24, 'noor': 24, 'light': 24,
  'furqan': 25, 'furqaan': 25, 'criterion': 25,
  'shuara': 26, 'shuaraa': 26, 'poets': 26,
  'naml': 27, 'ant': 27, 'ants': 27,
  'qasas': 28, 'stories': 28,
  'ankabut': 29, 'ankaboot': 29, 'spider': 29,
  'rum': 30, 'room': 30, 'romans': 30,
  'luqman': 31, 'luqmaan': 31,
  'sajda': 32, 'sajdah': 32, 'prostration': 32,
  'ahzab': 33, 'ahsab': 33, 'confederates': 33, 'clans': 33, // includes common typo
  'saba': 34, 'sabaa': 34, 'sheba': 34,
  'fatir': 35, 'faatir': 35, 'originator': 35,
  'yasin': 36, 'yaseen': 36, 'ya-sin': 36,
  'saffat': 37, 'saaffaat': 37, 'rangers': 37,
  'sad': 38, 'saad': 38,
  'zumar': 39, 'crowds': 39, 'groups': 39,
  'ghafir': 40, 'ghaafir': 40, 'forgiver': 40, 'mumin': 40,
  'fussilat': 41, 'hameem sajdah': 41, 'explained': 41,
  'shura': 42, 'shoora': 42, 'consultation': 42,
  'zukhruf': 43, 'ornaments': 43,
  'dukhan': 44, 'dukhaan': 44, 'smoke': 44,
  'jathiya': 45, 'jaathiya': 45, 'kneeling': 45,
  'ahqaf': 46, 'ahqaaf': 46, 'dunes': 46,
  'muhammad': 47,
  'fath': 48, 'victory': 48,
  'hujurat': 49, 'hujuraat': 49, 'chambers': 49, 'rooms': 49,
  'qaf': 50, 'qaaf': 50,
  'dhariyat': 51, 'dhaariyaat': 51, 'winnowing': 51,
  'tur': 52, 'toor': 52, 'mount': 52,
  'najm': 53, 'star': 53,
  'qamar': 54, 'moon': 54,
  'rahman': 55, 'rahmaan': 55, 'merciful': 55,
  'waqia': 56, 'waqiah': 56, 'waaqia': 56, 'inevitable': 56,
  'hadid': 57, 'hadeed': 57, 'iron': 57,
  'mujadila': 58, 'mujaadila': 58, 'pleading': 58,
  'hashr': 59, 'gathering': 59, 'exile': 59,
  'mumtahina': 60, 'mumtahinah': 60, 'examined': 60,
  'saff': 61, 'ranks': 61, 'row': 61,
  'jumua': 62, 'jumuah': 62, 'friday': 62,
  'munafiqun': 63, 'munafiqoon': 63, 'hypocrites': 63,
  'taghabun': 64, 'taghaabun': 64,
  'talaq': 65, 'talaaq': 65, 'divorce': 65,
  'tahrim': 66, 'tahreem': 66, 'prohibition': 66,
  'mulk': 67, 'sovereignty': 67, 'dominion': 67,
  'qalam': 68, 'pen': 68, 'noon': 68,
  'haqqa': 69, 'haaqqah': 69, 'reality': 69,
  'maarij': 70, 'maaarij': 70, 'ascending': 70,
  'nuh': 71, 'nooh': 71, 'noah': 71,
  'jinn': 72,
  'muzzammil': 73, 'muzammil': 73, 'wrapped': 73,
  'muddathir': 74, 'mudaththir': 74, 'cloaked': 74,
  'qiyama': 75, 'qiyaamah': 75, 'resurrection': 75,
  'insan': 76, 'insaan': 76, 'dahr': 76, 'man': 76,
  'mursalat': 77, 'mursalaat': 77,
  'naba': 78, 'nabaa': 78, 'tidings': 78, 'news': 78,
  'naziat': 79, 'naaziaat': 79, 'extractors': 79,
  'abasa': 80, 'frowned': 80,
  'takwir': 81, 'takweer': 81, 'folding': 81,
  'infitar': 82, 'infitaar': 82, 'cleaving': 82,
  'mutaffifin': 83, 'mutaffifeen': 83, 'defrauding': 83,
  'inshiqaq': 84, 'inshiqaaq': 84, 'splitting': 84,
  'buruj': 85, 'burooj': 85, 'constellations': 85,
  'tariq': 86, 'taariq': 86,
  'ala': 87, 'aala': 87,
  'ghashiya': 88, 'ghaashiya': 88, 'overwhelming': 88,
  'fajr': 89, 'dawn': 89,
  'balad': 90, 'city': 90,
  'shams': 91, 'sun': 91,
  'layl': 92, 'lail': 92, 'night': 92,
  'duha': 93, 'dhuha': 93, 'forenoon': 93,
  'sharh': 94, 'inshirah': 94, 'relief': 94, 'expansion': 94,
  'tin': 95, 'teen': 95, 'fig': 95,
  'alaq': 96, 'clot': 96, 'iqra': 96,
  'qadr': 97, 'power': 97, 'decree': 97,
  'bayyina': 98, 'bayyinah': 98, 'evidence': 98,
  'zalzala': 99, 'zilzal': 99, 'zilzaal': 99, 'earthquake': 99,
  'adiyat': 100, 'aadiyaat': 100, 'coursers': 100,
  'qaria': 101, 'qaariah': 101, 'calamity': 101,
  'takathur': 102, 'takaathur': 102, 'competition': 102,
  'asr': 103, 'time': 103, 'declining day': 103,
  'humaza': 104, 'slanderer': 104,
  'fil': 105, 'feel': 105, 'elephant': 105,
  'quraysh': 106, 'quraish': 106,
  'maun': 107, 'maaun': 107, 'assistance': 107,
  'kawthar': 108, 'kauthar': 108, 'abundance': 108,
  'kafirun': 109, 'kaafiroon': 109, 'disbelievers': 109,
  'nasr': 110, 'help': 110,
  'masad': 111, 'lahab': 111,
  'ikhlas': 112, 'ikhlaas': 112, 'sincerity': 112, 'purity': 112,
  'falaq': 113, 'daybreak': 113,
  'nas': 114, 'naas': 114, 'mankind': 114,
};

/**
 * Normalize query by converting Arabic surah names to chapter numbers
 * e.g., "Surat Al-Ahzab verse 72" → "Quran 33 verse 72"
 */
function normalizeQuery(query: string): string {
  let normalized = query.toLowerCase();
  
  // Remove "surat ", "surah ", "sura " prefixes
  normalized = normalized.replace(/\b(surat?h?)\s+/gi, '');
  
  // Remove "al-" prefix for matching
  const withoutAl = normalized.replace(/\bal-/gi, '');
  
  // Check each surah alias
  for (const [name, chapter] of Object.entries(SURAH_ALIASES)) {
    const regex = new RegExp(`\\b${name}\\b`, 'gi');
    if (regex.test(normalized) || regex.test(withoutAl)) {
      // Replace the surah name with "Quran {chapter}"
      normalized = normalized.replace(regex, `Quran ${chapter}`);
      normalized = normalized.replace(new RegExp(`\\bal-${name}\\b`, 'gi'), `Quran ${chapter}`);
      break; // Only match one surah per query
    }
  }
  
  return normalized;
}

export type SourceType = 'quran' | 'hadith_bukhari' | 'hadith_muslim' | 'bible' | 'torah' | 'secular' | 'islamic_knowledge';

export interface SearchResult {
  id: string;
  reference: string;
  text: string;
  source: SourceType;
  score: number;
}

// Initialize NLP
const winkNLP = nlp(model);
const its = winkNLP.its;

// Create search engines for each source
const searchEngines: Record<string, ReturnType<typeof bm25>> = {};

// Prepare text for BM25
function prepareText(text: string): string[] {
  const doc = winkNLP.readDoc(text.toLowerCase());
  return doc.tokens()
    .filter((t: any) => t.out(its.type) === 'word' && !t.out(its.stopWordFlag))
    .out(its.normal);
}

// Initialize a search engine with documents
function initSearchEngine(name: string, documents: Array<{ id: string; reference: string; text: string; source: string }>) {
  const engine = bm25();
  
  engine.defineConfig({ fldWeights: { text: 2, reference: 1 } });
  engine.definePrepTasks([prepareText]);
  
  documents.forEach((doc, idx) => {
    engine.addDoc({ text: doc.text, reference: doc.reference }, idx);
  });
  
  engine.consolidate();
  
  return { engine, documents };
}

// Lazy initialization
let initialized = false;
const engines: Record<string, { engine: any; documents: any[] }> = {};

function ensureInitialized() {
  if (initialized) return;
  
  console.log('[Corpus] Initializing search engines...');
  const start = Date.now();
  
  engines.quran = initSearchEngine('quran', quranData as any);
  engines.hadith_bukhari = initSearchEngine('hadith_bukhari', bukhariData as any);
  engines.hadith_muslim = initSearchEngine('hadith_muslim', muslimData as any);
  engines.bible = initSearchEngine('bible', bibleData as any);
  engines.torah = initSearchEngine('torah', torahData as any);
  engines.secular = initSearchEngine('secular', secularData as any);
  engines.islamic_knowledge = initSearchEngine('islamic_knowledge', salahGuideData as any);
  
  initialized = true;
  console.log(`[Corpus] Initialized in ${Date.now() - start}ms`);
}

// Get sources for a perspective
export function getSourcesForPerspective(perspective: string): SourceType[] {
  switch (perspective) {
    case 'islam':
      return ['quran', 'hadith_bukhari', 'hadith_muslim', 'islamic_knowledge'];
    case 'christianity':
      return ['bible'];
    case 'judaism':
      return ['torah'];
    case 'abrahamic':
      return ['quran', 'bible', 'torah', 'islamic_knowledge'];
    case 'secular':
      return ['secular'];
    case 'mixed':
      return ['quran', 'hadith_bukhari', 'hadith_muslim', 'bible', 'torah', 'secular', 'islamic_knowledge'];
    default:
      return [];
  }
}

// Search corpus
export function searchCorpus(
  query: string,
  perspective: string,
  maxResults: number = 5
): SearchResult[] {
  ensureInitialized();
  
  const sources = getSourcesForPerspective(perspective);
  if (sources.length === 0) return [];
  
  // Normalize query to handle Arabic surah names
  const normalizedQuery = normalizeQuery(query);
  if (normalizedQuery !== query.toLowerCase()) {
    console.log(`[Corpus] Query normalized: "${query}" → "${normalizedQuery}"`);
  }
  
  const allResults: SearchResult[] = [];
  
  for (const source of sources) {
    const { engine, documents } = engines[source];
    if (!engine) continue;
    
    try {
      const results = engine.search(normalizedQuery, maxResults);
      
      for (const [idx, score] of results) {
        const doc = documents[idx];
        if (doc) {
          allResults.push({
            id: doc.id,
            reference: doc.reference,
            text: doc.text,
            source: source as SourceType,
            score: score,
          });
        }
      }
    } catch (e) {
      console.error(`[Corpus] Search error for ${source}:`, e);
    }
  }
  
  // Sort by score and take top results
  allResults.sort((a, b) => b.score - a.score);
  return allResults.slice(0, maxResults);
}

// Format sources for prompt — with source type clearly labeled for grounded citation
export function formatSourcesForPrompt(results: SearchResult[]): string {
  if (results.length === 0) return '';
  
  return results
    .map((r, i) => {
      const sourceLabel = r.source.replace(/_/g, ' ').replace('hadith ', 'Hadith ');
      return `[${i + 1}] [${sourceLabel.toUpperCase()}] ${r.reference}\n"${r.text}"`;
    })
    .join('\n\n');
}
