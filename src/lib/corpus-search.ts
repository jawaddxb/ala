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

export type SourceType = 'quran' | 'hadith_bukhari' | 'hadith_muslim' | 'bible' | 'torah' | 'secular';

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
  
  initialized = true;
  console.log(`[Corpus] Initialized in ${Date.now() - start}ms`);
}

// Get sources for a perspective
export function getSourcesForPerspective(perspective: string): SourceType[] {
  switch (perspective) {
    case 'islam':
      return ['quran', 'hadith_bukhari', 'hadith_muslim'];
    case 'christianity':
      return ['bible'];
    case 'judaism':
      return ['torah'];
    case 'abrahamic':
      return ['quran', 'bible', 'torah'];
    case 'secular':
      return ['secular'];
    case 'mixed':
      return ['quran', 'bible', 'torah', 'secular'];
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
  
  const allResults: SearchResult[] = [];
  
  for (const source of sources) {
    const { engine, documents } = engines[source];
    if (!engine) continue;
    
    try {
      const results = engine.search(query, maxResults);
      
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

// Format sources for prompt
export function formatSourcesForPrompt(results: SearchResult[]): string {
  if (results.length === 0) return '';
  
  return results
    .map((r, i) => `${i + 1}. ${r.reference}:\n   "${r.text}"`)
    .join('\n\n');
}
