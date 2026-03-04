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
    whereClause += ' AND (text LIKE ? OR reference LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
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

// Call on module load
initializeDefaultAdmin();

export default db;
