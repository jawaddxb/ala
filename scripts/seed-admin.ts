import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';

const dbPath = path.join(process.cwd(), 'data', 'ala.db');

// Ensure data directory exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);

// Create tables if they don't exist
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
`);

const adminEmail = process.env.ADMIN_EMAIL || 'admin@ala.app';
const adminPassword = process.env.ADMIN_PASSWORD || 'ala-admin-2026';
const adminName = 'Admin';

// Check if admin exists
const existing = db.prepare('SELECT * FROM users WHERE email = ?').get(adminEmail);

if (existing) {
  console.log(`Admin user ${adminEmail} already exists`);
  process.exit(0);
}

// Create admin
const hashedPassword = bcrypt.hashSync(adminPassword, 10);
const stmt = db.prepare('INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)');
stmt.run(adminEmail, hashedPassword, adminName, 'admin');

console.log(`✅ Admin user created:`);
console.log(`   Email: ${adminEmail}`);
console.log(`   Password: ${adminPassword}`);
console.log(`   Role: admin`);
