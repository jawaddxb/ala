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
