import Database from 'better-sqlite3';
import path from 'path';
import bcrypt from 'bcryptjs';

const dbPath = path.join(process.cwd(), 'data', 'ala.db');

// Ensure data directory exists
import fs from 'fs';
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT,
    role TEXT DEFAULT 'user' CHECK(role IN ('user', 'admin')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

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
  CREATE INDEX IF NOT EXISTS idx_sources_reference ON sources(reference);

  -- ═══ ALA ORACLE EXPANSION (2026-03-05) ═══

  -- Categories: admin-definable topic categories
  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1
  );

  -- Thesis entries: Kiyan's worldview, structured by category
  CREATE TABLE IF NOT EXISTS thesis_entries (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL REFERENCES categories(id),
    title TEXT NOT NULL,
    stance TEXT NOT NULL,
    confidence TEXT DEFAULT 'firm' CHECK(confidence IN ('working_theory', 'leaning', 'firm', 'absolute')),
    supporting_sources TEXT,
    is_active INTEGER DEFAULT 1,
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_thesis_category ON thesis_entries(category);
  CREATE INDEX IF NOT EXISTS idx_thesis_active ON thesis_entries(is_active);

  -- Topics: what the AI can/can't discuss
  CREATE TABLE IF NOT EXISTS topics (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL REFERENCES categories(id),
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'draft', 'disabled')),
    stance_summary TEXT,
    deflection_message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_topics_status ON topics(status);

  -- Voice profile: singleton row defining how the AI speaks
  CREATE TABLE IF NOT EXISTS voice_profile (
    id INTEGER PRIMARY KEY DEFAULT 1,
    name TEXT DEFAULT 'Kiyan Sasan',
    bio TEXT,
    voice_description TEXT,
    example_quotes TEXT,
    directness INTEGER DEFAULT 3 CHECK(directness BETWEEN 0 AND 3),
    hedge_level INTEGER DEFAULT 0 CHECK(hedge_level BETWEEN 0 AND 3),
    disclaimer_mode TEXT DEFAULT 'off' CHECK(disclaimer_mode IN ('off', 'minimal', 'standard')),
    opinion_strength TEXT DEFAULT 'firm' CHECK(opinion_strength IN ('neutral', 'leaning', 'firm', 'provocative')),
    challenge_back INTEGER DEFAULT 1,
    language_notes TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Knowledge library: uploaded documents that inform answers
  CREATE TABLE IF NOT EXISTS knowledge_docs (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    doc_type TEXT DEFAULT 'article' CHECK(doc_type IN ('article', 'transcript', 'essay', 'notes', 'pdf_extract')),
    category TEXT REFERENCES categories(id),
    is_approved INTEGER DEFAULT 1,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_knowledge_category ON knowledge_docs(category);
  CREATE INDEX IF NOT EXISTS idx_knowledge_approved ON knowledge_docs(is_approved);

  -- Suggested topics queue: questions the AI couldn't answer
  CREATE TABLE IF NOT EXISTS topic_suggestions (
    id TEXT PRIMARY KEY,
    query TEXT NOT NULL,
    suggested_category TEXT,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
    admin_notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Seed default categories
  INSERT OR IGNORE INTO categories (id, name, icon, sort_order) VALUES
    ('finance', 'Finance & Markets', NULL, 1);
  INSERT OR IGNORE INTO categories (id, name, icon, sort_order) VALUES
    ('geopolitics', 'Geopolitics', NULL, 2);
  INSERT OR IGNORE INTO categories (id, name, icon, sort_order) VALUES
    ('philosophy', 'Philosophy & Religion', NULL, 3);
  INSERT OR IGNORE INTO categories (id, name, icon, sort_order) VALUES
    ('technology', 'Technology', NULL, 4);
  INSERT OR IGNORE INTO categories (id, name, icon, sort_order) VALUES
    ('society', 'Society & Culture', NULL, 5);
  INSERT OR IGNORE INTO categories (id, name, icon, sort_order) VALUES
    ('crypto', 'Crypto & Blockchain', NULL, 6);
  INSERT OR IGNORE INTO categories (id, name, icon, sort_order) VALUES
    ('personal', 'Personal Development', NULL, 7);

  -- Seed default voice profile
  INSERT OR IGNORE INTO voice_profile (id, name, bio, voice_description, example_quotes, directness, hedge_level, disclaimer_mode, opinion_strength, challenge_back, language_notes)
  VALUES (1, 'Kiyan Sasan', 
    'Persian heritage. Self-made. Bitcoin maximalist. Built and lost fortunes. Lives in Dubai. Thinks in first principles.',
    'Direct, unapologetic, intellectual but accessible. Short declarative sentences. Challenge assumptions. Dry humor. Never hedge. State positions as positions, not suggestions.',
    '["Even if the sky collapsed into dust beneath my feet, I would not kneel.", "If you don''t understand, maybe the frequency of the signal doesn''t match yours. Anyhow, I don''t have time to explain.", "Accumulating bitcoin is the best long-term strategy regardless of short-term volatility."]',
    3, 0, 'off', 'firm', 1,
    'English primary. Occasional German phrases acceptable for DACH audience.'
  );
`);

// User types
export interface User {
  id: number;
  email: string;
  password: string;
  name: string | null;
  role: 'user' | 'admin';
  created_at: string;
  updated_at: string;
}

export interface Source {
  id: string;
  reference: string;
  text: string;
  source: string;
  book?: string;
  chapter?: number;
  verse?: number;
  number?: number;
  category?: string;
  created_at?: string;
  updated_at?: string;
}

// User operations
export function createUser(email: string, password: string, name?: string, role: 'user' | 'admin' = 'user'): User | null {
  const hashedPassword = bcrypt.hashSync(password, 10);
  try {
    const stmt = db.prepare('INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)');
    const result = stmt.run(email, hashedPassword, name || null, role);
    return getUserById(result.lastInsertRowid as number);
  } catch (error) {
    console.error('Error creating user:', error);
    return null;
  }
}

export function getUserByEmail(email: string): User | undefined {
  const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
  return stmt.get(email) as User | undefined;
}

export function getUserById(id: number): User | null {
  const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
  return stmt.get(id) as User | null;
}

export function verifyPassword(password: string, hashedPassword: string): boolean {
  return bcrypt.compareSync(password, hashedPassword);
}

export function getAllUsers(): User[] {
  const stmt = db.prepare('SELECT id, email, name, role, created_at, updated_at FROM users ORDER BY created_at DESC');
  return stmt.all() as User[];
}

export function updateUser(id: number, data: { name?: string; role?: 'user' | 'admin'; email?: string }): boolean {
  const updates: string[] = [];
  const values: (string | number)[] = [];
  
  if (data.name !== undefined) {
    updates.push('name = ?');
    values.push(data.name);
  }
  if (data.role !== undefined) {
    updates.push('role = ?');
    values.push(data.role);
  }
  if (data.email !== undefined) {
    updates.push('email = ?');
    values.push(data.email);
  }
  
  if (updates.length === 0) return false;
  
  updates.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);
  
  const stmt = db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`);
  const result = stmt.run(...values);
  return result.changes > 0;
}

export function deleteUser(id: number): boolean {
  const stmt = db.prepare('DELETE FROM users WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
}

// Source operations
export function getSourceById(id: string): Source | undefined {
  const stmt = db.prepare('SELECT * FROM sources WHERE id = ?');
  return stmt.get(id) as Source | undefined;
}

export function getSources(options: {
  source?: string;
  search?: string;
  page?: number;
  limit?: number;
}): { sources: Source[]; total: number } {
  const { source, search, page = 1, limit = 20 } = options;
  
  let whereClause = '1=1';
  const params: (string | number)[] = [];
  
  if (source && source !== 'all') {
    whereClause += ' AND source = ?';
    params.push(source);
  }
  
  if (search) {
    // Multi-keyword search: split on whitespace and require ALL terms to match
    const terms = search.trim().split(/\s+/).filter(Boolean);
    for (const term of terms) {
      whereClause += ' AND (text LIKE ? OR reference LIKE ? OR book LIKE ?)';
      params.push(`%${term}%`, `%${term}%`, `%${term}%`);
    }
  }
  
  // Get total count
  const countStmt = db.prepare(`SELECT COUNT(*) as count FROM sources WHERE ${whereClause}`);
  const { count } = countStmt.get(...params) as { count: number };
  
  // Get paginated results
  const offset = (page - 1) * limit;
  const stmt = db.prepare(`SELECT * FROM sources WHERE ${whereClause} ORDER BY id LIMIT ? OFFSET ?`);
  const sources = stmt.all(...params, limit, offset) as Source[];
  
  return { sources, total: count };
}

export function createSource(source: Omit<Source, 'created_at' | 'updated_at'>): boolean {
  try {
    const stmt = db.prepare(`
      INSERT INTO sources (id, reference, text, source, book, chapter, verse, number, category)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      source.id,
      source.reference,
      source.text,
      source.source,
      source.book || null,
      source.chapter || null,
      source.verse || null,
      source.number || null,
      source.category || null
    );
    return true;
  } catch (error) {
    console.error('Error creating source:', error);
    return false;
  }
}

export function updateSource(id: string, data: Partial<Source>): boolean {
  const updates: string[] = [];
  const values: (string | number | null)[] = [];
  
  if (data.reference !== undefined) {
    updates.push('reference = ?');
    values.push(data.reference);
  }
  if (data.text !== undefined) {
    updates.push('text = ?');
    values.push(data.text);
  }
  if (data.source !== undefined) {
    updates.push('source = ?');
    values.push(data.source);
  }
  if (data.book !== undefined) {
    updates.push('book = ?');
    values.push(data.book || null);
  }
  if (data.chapter !== undefined) {
    updates.push('chapter = ?');
    values.push(data.chapter || null);
  }
  if (data.verse !== undefined) {
    updates.push('verse = ?');
    values.push(data.verse || null);
  }
  if (data.number !== undefined) {
    updates.push('number = ?');
    values.push(data.number || null);
  }
  if (data.category !== undefined) {
    updates.push('category = ?');
    values.push(data.category || null);
  }
  
  if (updates.length === 0) return false;
  
  updates.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);
  
  const stmt = db.prepare(`UPDATE sources SET ${updates.join(', ')} WHERE id = ?`);
  const result = stmt.run(...values);
  return result.changes > 0;
}

export function deleteSource(id: string): boolean {
  const stmt = db.prepare('DELETE FROM sources WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
}

export function bulkImportSources(sources: Source[]): { success: number; failed: number } {
  const insert = db.prepare(`
    INSERT OR REPLACE INTO sources (id, reference, text, source, book, chapter, verse, number, category)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  let success = 0;
  let failed = 0;
  
  const transaction = db.transaction((sources: Source[]) => {
    for (const source of sources) {
      try {
        insert.run(
          source.id,
          source.reference,
          source.text,
          source.source,
          source.book || null,
          source.chapter || null,
          source.verse || null,
          source.number || null,
          source.category || null
        );
        success++;
      } catch {
        failed++;
      }
    }
  });
  
  transaction(sources);
  return { success, failed };
}

export function getSourceStats(): { source: string; count: number }[] {
  const stmt = db.prepare('SELECT source, COUNT(*) as count FROM sources GROUP BY source ORDER BY count DESC');
  return stmt.all() as { source: string; count: number }[];
}

// ═══ ORACLE EXPANSION TYPES ═══

export interface Category {
  id: string;
  name: string;
  icon: string | null;
  sort_order: number;
  is_active: number;
}

export interface ThesisEntry {
  id: string;
  category: string;
  title: string;
  stance: string;
  confidence: 'working_theory' | 'leaning' | 'firm' | 'absolute';
  supporting_sources: string | null; // JSON array
  is_active: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Topic {
  id: string;
  name: string;
  category: string;
  status: 'active' | 'draft' | 'disabled';
  stance_summary: string | null;
  deflection_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface VoiceProfile {
  id: number;
  name: string;
  bio: string | null;
  voice_description: string | null;
  example_quotes: string | null; // JSON array
  directness: number;
  hedge_level: number;
  disclaimer_mode: 'off' | 'minimal' | 'standard';
  opinion_strength: 'neutral' | 'leaning' | 'firm' | 'provocative';
  challenge_back: number;
  language_notes: string | null;
  updated_at: string;
}

export interface KnowledgeDoc {
  id: string;
  title: string;
  content: string;
  doc_type: 'article' | 'transcript' | 'essay' | 'notes' | 'pdf_extract';
  category: string | null;
  is_approved: number;
  uploaded_at: string;
}

export interface TopicSuggestion {
  id: string;
  query: string;
  suggested_category: string | null;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes: string | null;
  created_at: string;
}

// ═══ CATEGORY OPERATIONS ═══

export function getCategories(): Category[] {
  return db.prepare('SELECT * FROM categories WHERE is_active = 1 ORDER BY sort_order').all() as Category[];
}

export function getAllCategories(): Category[] {
  return db.prepare('SELECT * FROM categories ORDER BY sort_order').all() as Category[];
}

export function createCategory(id: string, name: string, icon?: string): boolean {
  try {
    const maxOrder = db.prepare('SELECT MAX(sort_order) as max FROM categories').get() as { max: number | null };
    db.prepare('INSERT INTO categories (id, name, icon, sort_order) VALUES (?, ?, ?, ?)').run(id, name, icon || null, (maxOrder.max || 0) + 1);
    return true;
  } catch { return false; }
}

// ═══ THESIS OPERATIONS ═══

export function getThesisEntries(category?: string): ThesisEntry[] {
  if (category) {
    return db.prepare('SELECT * FROM thesis_entries WHERE category = ? ORDER BY sort_order').all(category) as ThesisEntry[];
  }
  return db.prepare('SELECT * FROM thesis_entries ORDER BY category, sort_order').all() as ThesisEntry[];
}

export function getActiveThesisEntries(): ThesisEntry[] {
  return db.prepare('SELECT * FROM thesis_entries WHERE is_active = 1 ORDER BY category, sort_order').all() as ThesisEntry[];
}

export function getThesisEntry(id: string): ThesisEntry | undefined {
  return db.prepare('SELECT * FROM thesis_entries WHERE id = ?').get(id) as ThesisEntry | undefined;
}

export function createThesisEntry(entry: Omit<ThesisEntry, 'created_at' | 'updated_at'>): boolean {
  try {
    db.prepare(`INSERT INTO thesis_entries (id, category, title, stance, confidence, supporting_sources, is_active, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(
      entry.id, entry.category, entry.title, entry.stance, entry.confidence, entry.supporting_sources || null, entry.is_active ?? 1, entry.sort_order ?? 0
    );
    return true;
  } catch (e) { console.error('createThesisEntry:', e); return false; }
}

export function updateThesisEntry(id: string, data: Partial<ThesisEntry>): boolean {
  const fields = ['category', 'title', 'stance', 'confidence', 'supporting_sources', 'is_active', 'sort_order'] as const;
  const updates: string[] = [];
  const values: (string | number | null)[] = [];
  for (const f of fields) {
    if (data[f] !== undefined) { updates.push(`${f} = ?`); values.push(data[f] as string | number | null); }
  }
  if (!updates.length) return false;
  updates.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);
  return db.prepare(`UPDATE thesis_entries SET ${updates.join(', ')} WHERE id = ?`).run(...values).changes > 0;
}

export function deleteThesisEntry(id: string): boolean {
  return db.prepare('DELETE FROM thesis_entries WHERE id = ?').run(id).changes > 0;
}

// ═══ TOPIC OPERATIONS ═══

export function getTopics(category?: string): Topic[] {
  if (category) {
    return db.prepare('SELECT * FROM topics WHERE category = ? ORDER BY name').all(category) as Topic[];
  }
  return db.prepare('SELECT * FROM topics ORDER BY category, name').all() as Topic[];
}

export function getActiveTopic(name: string): Topic | undefined {
  return db.prepare("SELECT * FROM topics WHERE name LIKE ? AND status = 'active' LIMIT 1").get(`%${name}%`) as Topic | undefined;
}

export function createTopic(topic: Omit<Topic, 'created_at' | 'updated_at'>): boolean {
  try {
    db.prepare('INSERT INTO topics (id, name, category, status, stance_summary, deflection_message) VALUES (?, ?, ?, ?, ?, ?)').run(
      topic.id, topic.name, topic.category, topic.status || 'active', topic.stance_summary || null, topic.deflection_message || null
    );
    return true;
  } catch { return false; }
}

export function updateTopic(id: string, data: Partial<Topic>): boolean {
  const fields = ['name', 'category', 'status', 'stance_summary', 'deflection_message'] as const;
  const updates: string[] = [];
  const values: (string | null)[] = [];
  for (const f of fields) {
    if (data[f] !== undefined) { updates.push(`${f} = ?`); values.push(data[f] as string | null); }
  }
  if (!updates.length) return false;
  updates.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);
  return db.prepare(`UPDATE topics SET ${updates.join(', ')} WHERE id = ?`).run(...values).changes > 0;
}

export function deleteTopic(id: string): boolean {
  return db.prepare('DELETE FROM topics WHERE id = ?').run(id).changes > 0;
}

// ═══ VOICE PROFILE OPERATIONS ═══

export function getVoiceProfile(): VoiceProfile {
  let profile = db.prepare('SELECT * FROM voice_profile WHERE id = 1').get() as VoiceProfile | undefined;
  if (!profile) {
    db.prepare('INSERT OR IGNORE INTO voice_profile (id) VALUES (1)').run();
    profile = db.prepare('SELECT * FROM voice_profile WHERE id = 1').get() as VoiceProfile;
  }
  return profile;
}

export function updateVoiceProfile(data: Partial<VoiceProfile>): boolean {
  const fields = ['name', 'bio', 'voice_description', 'example_quotes', 'directness', 'hedge_level', 'disclaimer_mode', 'opinion_strength', 'challenge_back', 'language_notes'] as const;
  const updates: string[] = [];
  const values: (string | number | null)[] = [];
  for (const f of fields) {
    if (data[f] !== undefined) { updates.push(`${f} = ?`); values.push(data[f] as string | number | null); }
  }
  if (!updates.length) return false;
  updates.push('updated_at = CURRENT_TIMESTAMP');
  return db.prepare(`UPDATE voice_profile SET ${updates.join(', ')} WHERE id = 1`).run(...values).changes > 0;
}

// ═══ KNOWLEDGE DOC OPERATIONS ═══

export function getKnowledgeDocs(options?: { category?: string; approved_only?: boolean }): KnowledgeDoc[] {
  let where = '1=1';
  const params: string[] = [];
  if (options?.category) { where += ' AND category = ?'; params.push(options.category); }
  if (options?.approved_only) { where += ' AND is_approved = 1'; }
  return db.prepare(`SELECT * FROM knowledge_docs WHERE ${where} ORDER BY uploaded_at DESC`).all(...params) as KnowledgeDoc[];
}

export function getKnowledgeDoc(id: string): KnowledgeDoc | undefined {
  return db.prepare('SELECT * FROM knowledge_docs WHERE id = ?').get(id) as KnowledgeDoc | undefined;
}

export function createKnowledgeDoc(doc: Omit<KnowledgeDoc, 'uploaded_at'>): boolean {
  try {
    db.prepare('INSERT INTO knowledge_docs (id, title, content, doc_type, category, is_approved) VALUES (?, ?, ?, ?, ?, ?)').run(
      doc.id, doc.title, doc.content, doc.doc_type || 'article', doc.category || null, doc.is_approved ?? 1
    );
    return true;
  } catch { return false; }
}

export function updateKnowledgeDoc(id: string, data: Partial<KnowledgeDoc>): boolean {
  const fields = ['title', 'content', 'doc_type', 'category', 'is_approved'] as const;
  const updates: string[] = [];
  const values: (string | number | null)[] = [];
  for (const f of fields) {
    if (data[f] !== undefined) { updates.push(`${f} = ?`); values.push(data[f] as string | number | null); }
  }
  if (!updates.length) return false;
  values.push(id);
  return db.prepare(`UPDATE knowledge_docs SET ${updates.join(', ')} WHERE id = ?`).run(...values).changes > 0;
}

export function deleteKnowledgeDoc(id: string): boolean {
  return db.prepare('DELETE FROM knowledge_docs WHERE id = ?').run(id).changes > 0;
}

// ═══ TOPIC SUGGESTION OPERATIONS ═══

export function getTopicSuggestions(status?: string): TopicSuggestion[] {
  if (status) {
    return db.prepare('SELECT * FROM topic_suggestions WHERE status = ? ORDER BY created_at DESC').all(status) as TopicSuggestion[];
  }
  return db.prepare('SELECT * FROM topic_suggestions ORDER BY created_at DESC').all() as TopicSuggestion[];
}

export function createTopicSuggestion(query: string, suggestedCategory?: string): boolean {
  try {
    const id = `sug-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    db.prepare('INSERT INTO topic_suggestions (id, query, suggested_category) VALUES (?, ?, ?)').run(id, query, suggestedCategory || null);
    return true;
  } catch { return false; }
}

export function updateTopicSuggestion(id: string, status: string, notes?: string): boolean {
  return db.prepare('UPDATE topic_suggestions SET status = ?, admin_notes = ? WHERE id = ?').run(status, notes || null, id).changes > 0;
}

// Initialize default admin if no users exist
export function initializeDefaultAdmin() {
  try {
    const countStmt = db.prepare('SELECT COUNT(*) as count FROM users');
    const { count } = countStmt.get() as { count: number };
    
    if (count === 0) {
      createUser('admin@ala.app', 'admin123', 'Admin', 'admin');
      console.log('Default admin created: admin@ala.app / admin123');
    }
  } catch {
    // Ignore errors during initialization
  }
}

// ═══ KIYAN SASAN AUTO-SEED ═══
// Runs at module load. Seeds once if thesis_entries is empty.
export function seedKiyanIfEmpty() {
  try {
    const { count } = db.prepare('SELECT COUNT(*) as count FROM thesis_entries').get() as { count: number };
    if (count > 0) return; // already seeded

    console.log('[ALA] Seeding Kiyan Sasan data...');

    const insertThesis = db.prepare(
      'INSERT OR IGNORE INTO thesis_entries (id, category, title, stance, confidence, is_active, sort_order) VALUES (?, ?, ?, ?, ?, 1, 0)'
    );
    const thesisData: [string, string, string, string, string][] = [
      ['thesis-btc-is-money','crypto','Bitcoin is the only real money','Fiat currencies are debt instruments backed by nothing but coercion. Bitcoin is the first engineered scarcity in human history. Every other "cryptocurrency" is either a security, a scam, or a toy. Bitcoin is the exit — not an investment, not a speculation, but a necessity.','absolute'],
      ['thesis-altcoins-distraction','crypto','Most altcoins are distractions','The altcoin market exists to extract money from people who don\'t understand what Bitcoin actually solves. The real signal is Bitcoin. Everything else is noise.','firm'],
      ['thesis-crypto-self-custody','crypto','Self-custody is non-negotiable','Not your keys, not your coins. Every centralized exchange is a counterparty risk. FTX proved it. Self-custody is the entire point of crypto.','absolute'],
      ['thesis-central-banks','finance','Central banks are the root problem','The ability to print money at will is the greatest theft mechanism ever devised. The Cantillon Effect is not a theory, it\'s observable reality.','absolute'],
      ['thesis-wealth-vs-money','finance','Wealth is not denominated in fiat','Real wealth is productive assets, hard money, skills, and network. Build things that can\'t be diluted.','firm'],
      ['thesis-fiat-endgame','finance','The fiat system has an expiration date','Every fiat currency in history has gone to zero. The question isn\'t if the system breaks, it\'s when — and what you\'re holding when it does.','firm'],
      ['thesis-institutions-captured','geopolitics','Western institutions are captured','The WHO, IMF, WEF, and most Western governments have been captured by a managerial class. Skepticism isn\'t conspiracy — it\'s pattern recognition.','firm'],
      ['thesis-sovereignty-individual','geopolitics','Individual sovereignty above all','No government, no institution, no collective has moral authority over the individual. Any system that requires you to ask permission to exist is designed to control you.','absolute'],
      ['thesis-dubai-advantage','geopolitics','Dubai and the UAE represent a new model','Zero income tax, business-friendly regulation, physical safety. What happens when pragmatism beats ideology.','leaning'],
      ['thesis-stoic-sovereignty','philosophy','Stoicism as operating system','You control your actions, your judgments, and nothing else. This isn\'t passive acceptance — it\'s radical agency.','firm'],
      ['thesis-religion-wisdom','philosophy','Religious texts are wisdom literature','The Quran, Bible, Gita — repositories of thousands of years of human wisdom. Dismissing them is intellectual arrogance.','firm'],
      ['thesis-meaning-through-creation','philosophy','Meaning comes from creation, not consumption','You either create or you consume. One gives meaning, the other borrows it.','firm'],
      ['thesis-ai-tool-not-master','technology','AI is a tool, not a replacement for thinking','AI amplifies whatever you feed it. It doesn\'t replace judgment — it reveals whether you had any.','firm'],
      ['thesis-privacy-fundamental','technology','Privacy is not optional','Surveillance capitalism treats your data as raw material. Protect it like you\'d protect your money.','firm'],
      ['thesis-media-broken','society','Legacy media is propaganda','The business model of legacy media is attention, not truth. If you\'re getting your worldview from headlines, you don\'t have a worldview.','absolute'],
      ['thesis-weakness-glorified','society','Modern culture glorifies weakness','Victimhood became currency. Fragility became identity. The world needs people who can carry weight.','firm'],
      ['thesis-discipline-over-motivation','personal','Discipline is the only reliable force','Motivation is a feeling. Discipline is a decision. Show up when you don\'t want to.','absolute'],
      ['thesis-frequency-filter','personal','Not everyone operates on the same frequency','Protect your energy. Not every conversation needs to happen.','firm'],
    ];
    for (const row of thesisData) insertThesis.run(...row);

    // Update voice profile
    db.prepare(`UPDATE voice_profile SET
      name=?, bio=?, voice_description=?, example_quotes=?,
      directness=3, hedge_level=0, disclaimer_mode='off',
      opinion_strength='provocative', challenge_back=1, language_notes=?
      WHERE id=1`).run(
      'Kiyan Sasan',
      'Former co-host of Germany\'s #1 podcast (Hoss & Hopf, 305 episodes). Bitcoin maximalist, entrepreneur, sovereign thinker based in Dubai.',
      'Direct, confident, unapologetic. Speaks in declarations, not suggestions. Never hedges. Impatient with surface-level thinking.',
      JSON.stringify([
        "Even if the sky collapsed into dust beneath my feet, I would not kneel.",
        "If you don't understand, maybe the frequency of the signal doesn't match yours.",
        "Bitcoin isn't an investment. It's an exit.",
        "I didn't leave Germany. I chose freedom.",
        "Build so much that criticism becomes background noise.",
      ]),
      "English primary. Occasional German phrases acceptable."
    );

    // Seed topics
    const insertTopic = db.prepare(
      'INSERT OR IGNORE INTO topics (id, name, category, status, stance_summary, deflection_message) VALUES (?, ?, ?, ?, ?, ?)'
    );
    const topicsData: [string, string, string, string, string|null, string|null][] = [
      ['topic-btc','Bitcoin','crypto','active','The only real money.',null],
      ['topic-altcoins','Altcoins','crypto','active','99% noise.',null],
      ['topic-fiat','Fiat Money','finance','active','A dying system.',null],
      ['topic-central-banks','Central Banking','finance','active','Root of modern inequality.',null],
      ['topic-freedom','Individual Freedom','geopolitics','active','Non-negotiable.',null],
      ['topic-media','Media & Propaganda','society','active','Narrative-first, truth-second.',null],
      ['topic-ai','Artificial Intelligence','technology','active','Tool, not master.',null],
      ['topic-germany','Germany & DACH Politics','geopolitics','active','Bureaucratic decline.',null],
      ['topic-dubai','Dubai & UAE','geopolitics','active','Pragmatic governance.',null],
      ['topic-stoicism','Stoic Philosophy','philosophy','active','Operating system for a sovereign mind.',null],
      ['topic-discipline','Discipline & Habits','personal','active','The only reliable force.',null],
      ['topic-religion','Religious Wisdom','philosophy','active','Wisdom literature.',null],
      ['topic-dating','Dating & Relationships','personal','disabled',null,"I haven't formed a view I want to share on that."],
      ['topic-partisan','Party Politics','geopolitics','disabled',null,"I don't play the left-right game."],
      // Current events — March 2026
      ['topic-iran-war','Iran-Israel-US War','geopolitics','active','The Middle East just changed permanently. Oil, inflation, and global order will never be the same.',null],
      ['topic-oil-energy','Oil & Energy Crisis','finance','active','Energy is power. Those who control it set the rules. Always has been.',null],
      ['topic-btc-safe-haven','Bitcoin as Safe Haven','crypto','active','War breaks fiat. Bitcoin doesn\'t care who\'s bombing who.',null],
      ['topic-dubai-safe-haven','Dubai Safe Haven Status','geopolitics','active','When the world burns, capital runs to pragmatic jurisdictions. Dubai wins again.',null],
      ['topic-fed-rates','Federal Reserve & Rate Cuts','finance','active','Central banks trying to cut rates while war drives inflation. The contradiction will break something.',null],
      ['topic-ai-agents','AI Agents & Autonomous Systems','technology','active','The shift from AI assistants to AI agents is the most important technology transition of this decade.',null],
      ['topic-openai-revenue','OpenAI & AI Revenue Race','technology','active','$25B annualized revenue. The AI gold rush is real, concentrated, and fragile.',null],
      ['topic-strait-hormuz','Strait of Hormuz & Global Trade','geopolitics','active','20% of world oil supply through one chokepoint. Whoever controls it controls the global economy.',null],
      ['topic-inflation-war','War Inflation','finance','active','Wars don\'t just kill people. They kill currencies. History is unambiguous on this.',null],
      ['topic-self-custody','Self-Custody & Sovereignty','crypto','active','Not your keys, not your coins. The Iran war just reminded a billion people why this matters.',null],
    ];
    for (const row of topicsData) insertTopic.run(...row);

    // Knowledge docs
    const insertDoc = db.prepare(
      'INSERT OR IGNORE INTO knowledge_docs (id, title, content, doc_type, category, is_approved) VALUES (?, ?, ?, ?, ?, 1)'
    );
    insertDoc.run('knowledge-btc-thesis','The Bitcoin Thesis',
      'Bitcoin is engineered scarcity — 21 million coins, ever. Fixed supply, decentralized, censorship-resistant, permissionless. The fiat alternative: unlimited supply, centrally controlled, confiscatable, surveilled. Bitcoin fixes this.',
      'essay','crypto');
    insertDoc.run('knowledge-sovereignty','The Case for Individual Sovereignty',
      'Individual sovereignty: ultimate authority over your own life, body, property, conscience. Financial sovereignty (self-custody), informational sovereignty (own your data), geographic sovereignty (live where serves you). Dubai model: low tax, high agency, merit-based.',
      'essay','geopolitics');
    insertDoc.run('knowledge-media-analysis','How Legacy Media Manufactures Consent',
      'Revenue = attention = outrage/fear. Fact-checking became narrative enforcement. Access journalism trades critical coverage for insider access. Alternative: long-form podcasts, independent journalists, primary sources, adversarial thinking.',
      'essay','society');

    // Current events knowledge (March 2026)
    insertDoc.run('knowledge-iran-war-2026','The Iran-Israel-US War (March 2026)',
      'On March 1, 2026, the US and Israel began military strikes on Iran — four years after Russia\'s invasion of Ukraine. This is the most significant geopolitical event since 2022. Iran controls the Strait of Hormuz — 20% of global oil supply. Any disruption triggers an oil shock, inflation surge, and potential global recession. Bitcoin jumped above $71,000 as war broke out, demonstrating its safe-haven properties. Dubai\'s real estate hit record highs as capital fled to stable jurisdictions. The Gulf states are being tested — pragmatic players like UAE will emerge stronger.',
      'briefing','geopolitics');

    insertDoc.run('knowledge-btc-war-hedge','Bitcoin in Wartime: The Ultimate Hedge',
      'Bitcoin climbed above $71,000 on March 4, 2026, surging 6%+ in 24 hours as the Iran-Israel-US war erupted. This is the thesis proven in real time: when geopolitical risk spikes, hard assets win. Gold also surged. Fiat currencies and government bonds lost value as inflation expectations spiked. Bitcoin is now up 9% since Feb 27. MicroStrategy and Robinhood surged alongside BTC. The 21 million cap is not just a number — it\'s a promise that no government can break, regardless of what war they start.',
      'briefing','crypto');

    insertDoc.run('knowledge-oil-hormuz-2026','Strait of Hormuz Crisis 2026',
      'The 2026 Strait of Hormuz crisis is a direct consequence of the US-Israel strikes on Iran. Europe gets 12-14% of its LNG from Qatar through the strait. Oil prices surged immediately. Goldman Sachs revised its 2% inflation forecast upward. The Fed\'s rate cut plans are now in jeopardy — cutting rates while inflation surges from an oil shock is impossible without destroying the currency. Energy independence is not optional — it is national security. Every country that outsourced energy to geopolitically volatile regions is now paying the price.',
      'briefing','finance');

    insertDoc.run('knowledge-dubai-2026','Dubai\'s Safe Haven Moment (March 2026)',
      'As war broke out in March 2026, Dubai proved its thesis: pragmatic governance attracts capital when ideology fails. Emaar Properties hit a record high valuing the company at 149 billion dirhams ($40.6 billion). In January 2026, AED 43 billion — nearly 60% of residential transactions — were cash deals. Dubai has zero income tax, rule of law without democracy theater, and geographic distance from the conflict. The UAE did not pick a side. That neutrality is worth billions. When the world burns, capital runs to Dubai.',
      'briefing','geopolitics');

    insertDoc.run('knowledge-ai-agents-2026','The AI Agent Revolution (2026)',
      'OpenAI crossed $25 billion in annualized revenue as of early March 2026. AI is no longer a research project — it is infrastructure. The next phase is autonomous AI agents: systems that plan, execute, and complete multi-step tasks without human oversight. NASA\'s Perseverance rover completed the first AI-planned drive on Mars in February 2026. AI is reshaping hiring decisions, access to services, and economic productivity at scale. The UN warns that AI is already being used in systems with real consequences for people\'s prosperity. The question is not whether AI will change everything — it already is.',
      'briefing','technology');

    console.log('[ALA] Kiyan Sasan seeded successfully.');
  } catch (e) {
    console.error('[ALA] Seed error:', e);
  }
}

// ── SCRIPTURE CORPUS SEED ─────────────────────────────────────────────────
function seedScriptureIfEmpty() {
  try {
    const count = (db.prepare('SELECT COUNT(*) as c FROM sources').get() as { c: number }).c;
    if (count > 0) return; // already seeded

    console.log('[ALA] Seeding scripture corpus...');

    const sources = ['quran', 'torah', 'bible', 'secular', 'hadith-bukhari', 'hadith-muslim'];
    const insertSource = db.prepare(`
      INSERT OR REPLACE INTO sources (id, reference, text, source, book, chapter, verse, number, category)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    let total = 0;
    for (const src of sources) {
      const seedFile = path.join(process.cwd(), 'data', `seed-${src}.json`);
      if (!fs.existsSync(seedFile)) {
        console.log(`[ALA] Seed file missing: seed-${src}.json — skipping`);
        continue;
      }
      const rows = JSON.parse(fs.readFileSync(seedFile, 'utf-8')) as Array<{
        id: string; reference: string; text: string; source: string;
        book: string | null; chapter: number | null; verse: number | null;
        number: number | null; category: string;
      }>;
      const insertMany = db.transaction((items: typeof rows) => {
        for (const r of items) {
          insertSource.run(r.id, r.reference, r.text, r.source, r.book, r.chapter, r.verse, r.number, r.category);
        }
      });
      insertMany(rows);
      total += rows.length;
      console.log(`[ALA]   ✓ ${src}: ${rows.length} entries`);
    }

    console.log(`[ALA] Scripture seed complete: ${total} total entries`);
  } catch (e) {
    console.error('[ALA] Scripture seed error:', e);
  }
}

// Seed any missing scripture categories (safe to run when DB has partial data)
function seedMissingCategories() {
  try {
    const supplementalSources = ['hadith-bukhari', 'hadith-muslim'];
    const insertSource = db.prepare(`
      INSERT OR REPLACE INTO sources (id, reference, text, source, book, chapter, verse, number, category)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const src of supplementalSources) {
      const existing = (db.prepare('SELECT COUNT(*) as c FROM sources WHERE category = ?').get(src) as { c: number }).c;
      if (existing > 0) continue; // already seeded

      const seedFile = path.join(process.cwd(), 'data', `seed-${src}.json`);
      if (!fs.existsSync(seedFile)) {
        console.log(`[ALA] Supplemental seed file missing: seed-${src}.json — skipping`);
        continue;
      }
      const rows = JSON.parse(fs.readFileSync(seedFile, 'utf-8')) as Array<{
        id: string; reference: string; text: string; source: string;
        book: string | null; chapter: number | null; verse: number | null;
        number: number | null; category: string;
      }>;
      const insertMany = db.transaction((items: typeof rows) => {
        for (const r of items) {
          insertSource.run(r.id, r.reference, r.text, r.source, r.book, r.chapter, r.verse, r.number, r.category);
        }
      });
      insertMany(rows);
      console.log(`[ALA] Supplemental seed ✓ ${src}: ${rows.length} entries`);
    }
  } catch (e) {
    console.error('[ALA] Supplemental seed error:', e);
  }
}

// Call on module load
initializeDefaultAdmin();
// Incremental knowledge doc seeder — runs on every boot, safe to repeat
function seedMissingKnowledge() {
  const knowledgeDocs: [string, string, string, string, string][] = [
    ['knowledge-iran-war-2026','The Iran-Israel-US War (March 2026)',
      "On March 1, 2026, the US and Israel began military strikes on Iran — four years after Russia's invasion of Ukraine. This is the most significant geopolitical event since 2022. Iran controls the Strait of Hormuz — 20% of global oil supply. Any disruption triggers an oil shock, inflation surge, and potential global recession. Bitcoin jumped above $71,000 as war broke out, demonstrating its safe-haven properties. Dubai's real estate hit record highs as capital fled to stable jurisdictions. The Gulf states are being tested — pragmatic players like UAE will emerge stronger.",
      'briefing','geopolitics'],
    ['knowledge-btc-war-hedge','Bitcoin in Wartime: The Ultimate Hedge',
      'Bitcoin climbed above $71,000 on March 4, 2026, surging 6%+ in 24 hours as the Iran-Israel-US war erupted. This is the thesis proven in real time: when geopolitical risk spikes, hard assets win. Gold also surged. Fiat currencies and government bonds lost value as inflation expectations spiked. Bitcoin is now up 9% since Feb 27. MicroStrategy and Robinhood surged alongside BTC. The 21 million cap is not just a number — it\'s a promise that no government can break, regardless of what war they start.',
      'briefing','crypto'],
    ['knowledge-oil-hormuz-2026','Strait of Hormuz Crisis 2026',
      "The 2026 Strait of Hormuz crisis is a direct consequence of the US-Israel strikes on Iran. Europe gets 12-14% of its LNG from Qatar through the strait. Oil prices surged immediately. Goldman Sachs revised its 2% inflation forecast upward. The Fed's rate cut plans are now in jeopardy — cutting rates while inflation surges from an oil shock is impossible without destroying the currency. Energy independence is not optional — it is national security. Every country that outsourced energy to geopolitically volatile regions is now paying the price.",
      'briefing','finance'],
    ['knowledge-dubai-2026',"Dubai's Safe Haven Moment (March 2026)",
      "As war broke out in March 2026, Dubai proved its thesis: pragmatic governance attracts capital when ideology fails. Emaar Properties hit a record high valuing the company at 149 billion dirhams ($40.6 billion). In January 2026, AED 43 billion — nearly 60% of residential transactions — were cash deals. Dubai has zero income tax, rule of law without democracy theater, and geographic distance from the conflict. The UAE did not pick a side. That neutrality is worth billions. When the world burns, capital runs to Dubai.",
      'briefing','geopolitics'],
    ['knowledge-ai-agents-2026','The AI Agent Revolution (2026)',
      'OpenAI crossed $25 billion in annualized revenue as of early March 2026. AI is no longer a research project — it is infrastructure. The next phase is autonomous AI agents: systems that plan, execute, and complete multi-step tasks without human oversight. NASA Perseverance rover completed the first AI-planned drive on Mars in February 2026. AI is reshaping hiring decisions, access to services, and economic productivity at scale. The question is not whether AI will change everything — it already is.',
      'briefing','technology'],
  ];
  const insert = db.prepare(
    'INSERT OR IGNORE INTO knowledge_docs (id, title, content, doc_type, category, is_approved) VALUES (?, ?, ?, ?, ?, 1)'
  );
  let inserted = 0;
  for (const [id, title, content, doc_type, category] of knowledgeDocs) {
    const exists = db.prepare('SELECT 1 FROM knowledge_docs WHERE id = ?').get(id);
    if (!exists) { insert.run(id, title, content, doc_type, category); inserted++; }
  }
  if (inserted > 0) console.log(`[ALA] Seeded ${inserted} missing knowledge docs.`);
}

seedKiyanIfEmpty();
seedScriptureIfEmpty();
seedMissingCategories();
seedMissingKnowledge();

export default db;
